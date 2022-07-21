# builtins
import re
import json
from collections import Counter
from glob import glob

# perf
from numba import njit
from functools import cache

# plotly
from dash import Dash, html, dcc, Input, Output, State, callback_context
import dash_cytoscape as cyto
from dash_extensions import EventListener
from notascope_components import DashDiff
import plotly.express as px
import plotly.graph_objects as go

# data science
import pandas as pd
import numpy as np
import igraph
from sklearn.manifold import MDS, TSNE
from umap import UMAP
from scipy.sparse.csgraph import minimum_spanning_tree
from scipy.sparse import coo_matrix
from scipy.cluster import hierarchy
from scipy.spatial.distance import squareform

default_study = "tiny"
vis_types = ["network", "tsne", "umap", "dendro"]
distance_types = ["difflib", "cd", "ncd"]

print("start", np.random.randint(1000))  # unseeded so every launch is different

difflib_df = pd.read_csv("results/difflib_costs.csv", names=["study", "notation", "from_slug", "to_slug", "difflib"])
ncd_df = pd.read_csv("results/ncd_costs.csv", names=["study", "notation", "from_slug", "to_slug", "a", "b", "ab"])
ncd_df["cd"] = ncd_df["ab"] - ncd_df[["a", "b"]].min(axis=1)
ncd_df["ncd"] = (1000 * ncd_df["cd"] / ncd_df[["a", "b"]].max(axis=1)).astype(int)
distances_df = pd.merge(difflib_df, ncd_df, how="outer")
tokens_df = pd.read_csv("results/tokens.tsv", names=["study", "notation", "slug", "token"], delimiter="\t")


def ext_of_longest(study, notation, obj):
    return sorted(glob(f"results/{study}/{notation}/{obj}/*"), key=len)[-1].split(".")[-1]


filter_prefix = "study==@study and notation==@notation"


def load_results():
    results = dict()
    for (study, notation), df in tokens_df.groupby(["study", "notation"]):
        if study not in results:
            results[study] = dict()
        results[study][notation] = dict(
            imgext=ext_of_longest(study, notation, "img"),
            srcext=ext_of_longest(study, notation, "source"),
            slugs=df["slug"].unique(),
            tokens=df["token"].nunique(),
        )
    return results


results = load_results()
print("ready")

app = Dash(__name__, title="NotaScope", suppress_callback_exceptions=True)


app.layout = html.Div(
    [
        html.Div(id="content"),
        dcc.Location(id="location"),
        dcc.Tooltip(
            id="tooltip",
            children=[
                html.Div(
                    [
                        html.P(id="tt_name", style=dict(textAlign="center")),
                        html.Img(id="tt_img", style={"max-width": "300px", "max-height": "200px"}),
                    ],
                    style={"width": "300px", "height": "230px", "overflow": "hidden"},
                )
            ],
        ),
        EventListener(
            id="event_listener",
            events=[
                {"event": "keydown", "props": ["shiftKey"]},
                {"event": "keyup", "props": ["shiftKey"]},
            ],
        ),
    ]
)


@cache
def dmat_and_order(study, notation, distance):
    df = distances_df.query(filter_prefix)
    dmat = df.pivot_table(index="from_slug", columns="to_slug", values=distance).fillna(0)
    order = list(dmat.index)
    dmat = dmat.values
    dmat_sym = (dmat + dmat.T) / 2.0
    return dmat, dmat_sym, order


def get_dimred(study, notation, distance, from_slug, to_slug, method):
    fig_json, fig_df = build_dimred(study, notation, distance, method)
    fig = go.Figure(json.loads(fig_json))

    dmat, dmat_sym, order = dmat_and_order(study, notation, distance)
    if from_slug:
        from_row = fig_df.loc[from_slug]
        to_row = fig_df.loc[to_slug]
        fig.add_scatter(x=[from_row.x, to_row.x], y=[from_row.y, to_row.y], hoverinfo="skip", showlegend=False)
        if from_slug == to_slug:
            fig.data[0].marker = dict(color=dmat_sym[order.index(from_slug)], cmax=np.median(dmat_sym), colorscale="Viridis")
    else:
        fig.data[0].marker = dict(color=np.median(dmat_sym, axis=0))

    return fig


@cache
def build_dimred(study, notation, distance, method):
    dmat, dmat_sym, order = dmat_and_order(study, notation, distance)
    np.random.seed(123)
    if method == "tsne":
        dimred = TSNE(n_components=2, metric="precomputed", square_distances=True, learning_rate="auto", init="random")
    elif method == "umap":
        dimred = UMAP(n_components=2)
    embedding = dimred.fit_transform(dmat_sym)
    emb_df = pd.DataFrame(embedding, index=order, columns=["x", "y"])
    fig = px.scatter(emb_df, x="x", y="y", hover_name=order)
    fig.update_layout(height=800, dragmode="pan", plot_bgcolor="white")
    fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), uirevision="yes")
    fig.update_yaxes(visible=False)
    fig.update_xaxes(visible=False)
    fig.update_traces(hoverinfo="none", hovertemplate=None)

    return fig.to_json(), emb_df


def get_dendro(study, notation, distance, from_slug, to_slug):
    dmat, dmat_sym, order = dmat_and_order(study, notation, distance)
    fig_json, y_by_slug, leaves = build_dendro(study, notation, distance)
    fig = go.Figure(json.loads(fig_json))
    if from_slug:
        from_y = y_by_slug[from_slug]
        to_y = y_by_slug[to_slug]
        distance = dmat_sym[order.index(from_slug), order.index(to_slug)]
        fig.add_scatter(
            x=[0, -distance, -distance, 0],
            y=[from_y, from_y, to_y, to_y],
            marker_opacity=[1, 0, 0, 1],
            hoverinfo="skip",
            showlegend=False,
            marker_color="red",
            mode="lines+markers",
        )
        if from_slug == to_slug:
            fig.data[1].marker = dict(color=dmat_sym[order.index(from_slug)][leaves], cmax=np.median(dmat_sym), colorscale="Viridis")
        else:
            fig.data[1].marker.opacity = 0
    else:
        fig.data[1].marker = dict(color=np.median(dmat_sym, axis=0)[leaves])
    return fig


def append_members(nodes, node):
    if len(nodes[node]) == 2:
        return nodes[node][1]
    nodes[node].append([])
    for child in nodes[node][0]:
        if type(child) is int:
            nodes[node][1].append(child)
        else:
            nodes[node][1] += append_members(nodes, child)
    return nodes[node][1]


def make_nodes(P, order):
    nodes = dict()
    for xs, ys in zip(P["dcoord"], P["icoord"]):
        x_mid = (xs[1] + xs[2]) / 2
        y_mid = (ys[1] + ys[2]) / 2
        for k, key in enumerate([(xs[1], ys[1]), (x_mid, y_mid), (xs[2], ys[2])]):
            nodes[key] = [[]]
            for i in [0, 3]:
                if (i == 0 and k != 2) or (i == 3 and k != 0):
                    nodes[key][0].append((xs[i], ys[i]))
                if xs[i] == 0:
                    leaf_id = order.index(P["ivl"][int((ys[i] - 5) / 10)])
                    nodes[(xs[i], ys[i])] = [[leaf_id], [leaf_id]]
    for n in nodes:
        append_members(nodes, n)
    return nodes


def medioid(samples, dmat_sym):
    subset = dmat_sym[samples][:, samples]
    sum_dist = np.sum(subset, axis=0)
    return samples[np.argsort(sum_dist)[0]]


@cache
def build_dendro(study, notation, distance):
    dmat, dmat_sym, order = dmat_and_order(study, notation, distance)
    Z = hierarchy.linkage(squareform(dmat_sym), "complete", optimal_ordering=True)
    P = hierarchy.dendrogram(Z, labels=order, no_plot=True)
    nodes = make_nodes(P, order)
    x = []
    y = []
    hovertext = []
    label_x = []
    label_y = []
    label_text = []
    y_by_slug = dict()
    for i, (icoord, dcoord) in enumerate(zip(P["icoord"], P["dcoord"])):
        for j, (y_val, x_val) in enumerate(zip(icoord, dcoord)):
            y.append(y_val)
            x.append(-x_val)
            cluster_members = nodes[(x_val, y_val)][1]
            node_slug = None
            if len(cluster_members):
                cluster_medioid = medioid(cluster_members, dmat_sym)
                node_slug = order[cluster_medioid]
            hovertext.append(node_slug)

            if x_val == 0:
                slug = P["ivl"][int((y_val - 5) / 10)]
                if slug not in y_by_slug:
                    y_by_slug[slug] = y_val
                    label_x.append(-x_val)
                    label_y.append(y_val)
                    label_text.append(slug)
        y.append(None)
        x.append(None)
        hovertext.append(None)
    fig = go.Figure()
    fig.add_scatter(x=x, y=y, line_width=1, hovertext=hovertext, hoverinfo="none", mode="lines+markers", marker_size=1)
    fig.add_scatter(
        x=np.array(label_x)[np.argsort(label_y)],
        y=np.array(label_y)[np.argsort(label_y)],
        text=np.array(label_text)[np.argsort(label_y)],
        mode="markers+text",
        textposition="middle right",
        hoverinfo="skip",
        marker=dict(cmin=0, symbol="square"),
    )
    fig.update_layout(height=800, showlegend=False, dragmode="pan", plot_bgcolor="white")
    fig.update_layout(uirevision="yes")
    fig.update_yaxes(visible=False)
    return fig.to_json(), y_by_slug, P["leaves"]


def get_network(study, notation, distance, from_slug, to_slug):
    net = json.loads(build_network(study, notation, distance))

    if from_slug != to_slug:
        from_to_distance = get_distance(study, notation, distance, from_slug, to_slug)
        to_from_distance = get_distance(study, notation, distance, to_slug, from_slug)
        both_dirs = [[from_slug, to_slug], [to_slug, from_slug]]
        to_drop = ["__".join(x) for x in both_dirs]
        dropped = [elem for elem in net if elem["data"]["id"] in to_drop]
        net = [elem for elem in net if elem["data"]["id"] not in to_drop]
        for source, dest in both_dirs:
            id = source + "__" + dest
            new_elem = {
                "data": {
                    "source": source,
                    "target": dest,
                    "id": id,
                    "length": from_to_distance if source == from_slug else to_from_distance,
                },
                "classes": "",
            }
            if len(dropped) == 0 or (id not in [x["data"]["id"] for x in dropped] and "bidir" not in dropped[0]["classes"]):
                new_elem["classes"] += " inserted"
            if source == from_slug:
                new_elem["classes"] += " selected"
            net.append(new_elem)
    elif from_slug:
        dmat, dmat_sym, order = dmat_and_order(study, notation, distance)
        from_index = order.index(from_slug)
        top_indices = np.argsort(dmat_sym[from_index])
        for i in range(min(10, len(dmat_sym))):
            source = from_slug
            to_index = top_indices[i]
            dest = order[to_index]
            net.append(
                {
                    "data": {"source": source, "target": dest, "id": source + "__" + dest, "length": dmat_sym[from_index, to_index]},
                    "classes": "neighbour",
                }
            )
    for elem in net:
        if elem["data"]["id"] in [from_slug, to_slug]:
            elem["classes"] += " selected"
    return net


@njit
def find_edges(dmat):
    n = len(dmat)
    result = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            has_k = False
            direct = dmat[i, j]
            if direct != 0:
                for k in range(n):
                    if k == i or k == j:
                        continue
                    via_k = dmat[i, k] + dmat[k, j]
                    if (via_k - direct) / direct <= 0:
                        has_k = True
                        break
                if not has_k:
                    result[i, j] = direct
    return result


@cache
def build_network(study, notation, distance):
    dmat, dmat_sym, order = dmat_and_order(study, notation, distance)
    network_elements = []
    n = len(dmat)
    if n < 20:
        np.random.seed(123)
        mds = MDS(n_components=2, dissimilarity="precomputed")
        embedding = mds.fit_transform(dmat_sym)

        edges = find_edges(dmat)
        for i in range(n):
            for j in range(n):
                if edges[i, j] == 0:  # no zero or self-edges
                    continue
                longest = edges[i, j] > edges[j, i]
                eq = edges[i, j] == edges[j, i]
                this_eq = eq and i > j  # only first of the two bidir edges
                if longest or this_eq:
                    network_elements.append(
                        {
                            "data": {
                                "source": order[i],
                                "target": order[j],
                                "id": order[i] + "__" + order[j],
                                "length": edges[i, j],
                            },
                            "classes": (" bidir" if eq else ""),
                        }
                    )
    else:
        spanning = coo_matrix(minimum_spanning_tree(dmat_sym))
        g = igraph.Graph.Weighted_Adjacency(spanning.toarray().tolist())
        np.random.seed(123)
        layout = g.layout_kamada_kawai(maxiter=10000)
        embedding = np.array(layout.coords)

        for i, j, d in zip(spanning.row, spanning.col, spanning.data):
            network_elements.append(
                {
                    "data": {
                        "source": order[i],
                        "target": order[j],
                        "id": order[i] + "__" + order[j],
                        "length": d,
                    },
                    "classes": "",
                }
            )

    emb_df = pd.DataFrame(embedding, index=order, columns=["x", "y"])
    emb_span = embedding.max() - embedding.min()

    scale = 1000 if n < 20 else 10000
    imgext = results[study][notation]["imgext"]
    for i, row in emb_df.iterrows():
        network_elements.append(
            {
                "data": {
                    "id": i,
                    "label": i,
                    "url": f"/assets/results/{study}/{notation}/img/{i}.{imgext}",
                },
                "position": {c: row[c] * scale / emb_span for c in ["x", "y"]},
                "classes": "",
            }
        )
    return json.dumps(network_elements)


def parse_hashpath(hashpath):
    m = re.match("#" + "/(.*)" * 9, hashpath)
    if m:
        return sanitize_state(*m.groups())
    else:
        return sanitize_state()


def sanitize_state(study="", notation="", distance="", vis="", notation2="", distance2="", vis2="", from_slug="", to_slug=""):
    if vis not in vis_types:
        vis = vis_types[0]

    if vis2 not in vis_types:
        vis2 = vis_types[0]

    if distance not in distance_types:
        distance = distance_types[0]

    if distance2 not in distance_types:
        distance2 = distance_types[0]

    if study not in results:
        study = default_study

    study_res = results[study]
    slugs = set()
    if notation in study_res:
        for s in study_res[notation]["slugs"]:
            slugs.add(s)
    else:
        notation = list(results[study].keys())[0]

    if notation2 in study_res:
        for s in study_res[notation2]["slugs"]:
            slugs.add(s)
    else:
        notation2 = ""

    if notation2 == "":
        vis2 = ""
        distance2 = ""

    if from_slug not in slugs:
        from_slug = to_slug = ""
    elif to_slug not in slugs:
        to_slug = from_slug

    return study, notation, distance, vis, notation2, distance2, vis2, from_slug, to_slug


@app.callback(
    Output("location", "hash"),
    Output("network", "tapNodeData"),
    Output("network", "tapEdgeData"),
    Output("network2", "tapNodeData"),
    Output("network2", "tapEdgeData"),
    Input("selection", "data"),
    Input("study", "value"),
    Input("notation", "value"),
    Input("notation2", "value"),
    Input("distance", "value"),
    Input("distance2", "value"),
    Input("vis", "value"),
    Input("vis2", "value"),
    Input("network", "tapNodeData"),
    Input("network", "tapEdgeData"),
    Input("figure", "clickData"),
    Input("network2", "tapNodeData"),
    Input("network2", "tapEdgeData"),
    Input("figure2", "clickData"),
    State("event_listener", "event"),
)
def update_hashpath(
    selection, study, notation, notation2, distance, distance2, vis, vis2, node_data, edge_data, fig_data, node_data2, edge_data2, fig_data2, event
):
    shift_down = bool((dict(shiftKey=False) if not event else event)["shiftKey"])
    ctx = callback_context
    from_slug, to_slug = selection
    if ctx.triggered:
        click_notation = ctx.triggered[0]["prop_id"].split(".")[0]
        click_type = ctx.triggered[0]["prop_id"].split(".")[1]

        if click_type == "clickData":
            for id, data in [["figure", fig_data], ["figure2", fig_data2]]:
                if click_notation == id:
                    to_slug = data["points"][0]["hovertext"]
                    if from_slug == to_slug:
                        from_slug = to_slug = ""
                    elif not shift_down:
                        from_slug = to_slug
        if click_type == "tapNodeData":
            for id, data in [["network", node_data], ["network2", node_data2]]:
                if click_notation == id:
                    to_slug = data["id"]
                    if from_slug == to_slug:
                        from_slug = to_slug = ""
                    elif not shift_down:
                        from_slug = to_slug
            edge_data = None
            edge_data2 = None
        if click_type == "tapEdgeData":
            for id, data in [["network", edge_data], ["network2", edge_data2]]:
                if click_notation == id:
                    from_slug = data["source"]
                    to_slug = data["target"]
            node_data = None
            node_data2 = None
    hashpath = "#/" + "/".join(sanitize_state(study, notation, distance, vis, notation2, distance2, vis2, from_slug, to_slug))
    return hashpath, node_data, edge_data, node_data2, edge_data2


@app.callback(
    Output("content", "children"),
    Input("location", "hash"),
)
def update_content(hashpath):
    study, notation, distance, vis, notation2, distance2, vis2, from_slug, to_slug = parse_hashpath(hashpath)
    cmp, net, fig = details_view(study, notation, distance, vis, from_slug, to_slug)
    if notation2:
        style = dict()
        style2 = dict(gridColumnStart=2, display="block")
        cmp2, net2, fig2 = details_view(study, notation2, distance2, vis2, from_slug, to_slug)
    else:
        style = dict(gridRowStart=2)
        style2 = dict(display="none", gridRowStart=3)
        cmp2, net2, fig2 = None, [], {}

    vis2_style = dict(width="100px")
    if notation == notation2 and distance == distance2:
        cmp2 = None
    if not notation2:
        vis2_style["display"] = "none"

    notations = [dict(label=f"{s} ({results[study][s]['tokens']})", value=s) for s in results[study]]

    return html.Div(
        className="wrapper",
        children=[
            html.Div(
                [dcc.Dropdown(id="study", value=study, options=[s for s in results], clearable=False, style=dict(width="100px"))],
                style=dict(position="absolute", left=10, top=10),
            ),
            html.Div(
                [
                    html.Div(
                        dcc.Dropdown(id="notation", value=notation, options=notations, clearable=False, className="dropdown"),
                        style=dict(display="inline-block"),
                    ),
                    html.Div(
                        dcc.Dropdown(id="vis", value=vis, options=vis_types, clearable=False, style=dict(width="100px")),
                        style=dict(display="inline-block"),
                    ),
                    html.Div(
                        dcc.Dropdown(id="distance", value=distance, options=distance_types, clearable=False, style=dict(width="100px")),
                        style=dict(display="inline-block"),
                    ),
                ],
                style=dict(margin="0 auto"),
            ),
            html.Div(
                [
                    html.Div(
                        dcc.Dropdown(id="notation2", value=notation2, options=notations, clearable=True, className="dropdown"),
                        style=dict(display="inline-block"),
                    ),
                    html.Div(
                        dcc.Dropdown(id="vis2", value=vis2, options=vis_types, clearable=False, style=vis2_style),
                        style=dict(display="inline-block"),
                    ),
                    html.Div(
                        dcc.Dropdown(id="distance2", value=distance2, options=distance_types, clearable=False, style=vis2_style),
                        style=dict(display="inline-block"),
                    ),
                ],
                style=dict(margin="0 auto"),
            ),
            html.Div(network_or_figure(net, fig, ""), style=style),
            html.Div(network_or_figure(net2, fig2, "2"), style=style2),
            html.Div(cmp, className="comparison"),
            html.Div(cmp2, className="comparison"),
            dcc.Store(id="selection", data=[from_slug, to_slug]),
        ],
    )


def hide_if_none(thing):
    return dict() if thing else dict(display="none")


def network_or_figure(net, fig, suffix):
    return [
        html.Div(cytoscape("network" + suffix, net), style=hide_if_none(net)),
        html.Div(dcc.Graph(id="figure" + suffix, figure=fig, config=dict(scrollZoom=True), clear_on_unhover=True), style=hide_if_none(fig)),
    ]


def cytoscape(id, elements):
    return cyto.Cytoscape(
        id=id,
        className="network",
        layout={"name": "preset", "fit": True},
        minZoom=0.05,
        maxZoom=1,
        autoRefreshLayout=False,
        elements=elements,
        style=dict(height="800px", width="initial"),
        stylesheet=[
            {
                "selector": "node",
                "style": {
                    "width": 100,
                    "height": 100,
                    "shape": "rectangle",
                    "background-fit": "cover",
                    "background-image": "data(url)",
                    "label": "data(label)",
                    "border-color": "grey",
                    "border-width": 1,
                    "text-outline-color": "white",
                    "text-outline-width": "2",
                    "text-margin-y": "20",
                },
            },
            {
                "selector": "edge",
                "style": {
                    "line-color": "lightgrey",
                    "curve-style": "bezier",
                    "target-arrow-color": "lightgrey",
                    "control-point-weight": 0.6,
                    "target-arrow-shape": "triangle-backcurve",
                    "arrow-scale": 2,
                    "label": "data(length)",
                    "font-size": "24px",
                    "text-outline-color": "white",
                    "text-outline-width": "3",
                },
            },
            {
                "selector": ".bidir",
                "style": {
                    "source-arrow-color": "lightgrey",
                    "source-arrow-shape": "triangle-backcurve",
                },
            },
            {
                "selector": ".selected",
                "style": {
                    "source-arrow-color": "red",
                    "target-arrow-color": "red",
                    "line-color": "red",
                    "border-color": "red",
                    "border-width": 5,
                },
            },
            {
                "selector": ".inserted",
                "style": {"line-style": "dashed"},
            },
            {
                "selector": ".neighbour",
                "style": {"line-color": "red"},
            },
        ],
    )


def header_and_image(study, notation, slug, tokens_n, tokens_nunique):
    imgext = results[study][notation]["imgext"]
    return [
        html.H3(slug),
        html.P(f"{tokens_n} tokens, {tokens_nunique} uniques"),
        html.Img(
            src=f"/assets/results/{study}/{notation}/img/{slug}.{imgext}",
            style=dict(verticalAlign="middle", maxHeight="200px", maxWidth="20vw"),
        ),
    ]


def diff_view(study, notation, from_slug, to_slug):
    srcext = results[study][notation]["srcext"]
    with open(f"results/{study}/{notation}/source/{from_slug}.{srcext}", "r") as f:
        from_code = f.read()
    if from_slug == to_slug:
        to_code = from_code
    else:
        with open(f"results/{study}/{notation}/source/{to_slug}.{srcext}", "r") as f:
            to_code = f.read()
    return html.Div(
        [html.Div([DashDiff(oldCode=from_code, newCode=to_code)], style=dict(border="none"))],
        style=dict(marginTop="20px", textAlign="left", height="300px", maxWidth="48vw", overflow="scroll", border="1px solid grey"),
    )


def get_token_info(study, notation, slug):
    df = tokens_df.query(filter_prefix + " and slug==@slug")["token"]
    return df.values, len(df), df.nunique()


@cache
def get_distance(study, notation, distance, from_slug, to_slug):
    return distances_df.query(filter_prefix + " and from_slug==@from_slug and to_slug==@to_slug")[distance].values[0]


def details_view(study, notation, distance, vis, from_slug, to_slug):
    cmp = None
    net = []
    fig = {}
    if vis == "network":
        net = get_network(study, notation, distance, from_slug, to_slug)
    elif vis == "tsne":
        fig = get_dimred(study, notation, distance, from_slug, to_slug, method="tsne")
    elif vis == "umap":
        fig = get_dimred(study, notation, distance, from_slug, to_slug, method="umap")
    elif vis == "dendro":
        fig = get_dendro(study, notation, distance, from_slug, to_slug)
    else:
        raise Exception("invalid vis")

    try:
        from_tokens, from_tokens_n, from_tokens_nunique = get_token_info(study, notation, from_slug)
        if from_slug != to_slug:

            to_tokens, to_tokens_n, to_tokens_nunique = get_token_info(study, notation, to_slug)
            from_to_distance = get_distance(study, notation, distance, from_slug, to_slug)
            to_from_distance = get_distance(study, notation, distance, to_slug, from_slug)

            shared_tokens = list((Counter(from_tokens) & Counter(to_tokens)).elements())
            shared_uniques = set(from_tokens) & set(to_tokens)
            td1 = html.Td(
                header_and_image(study, notation, from_slug, from_tokens_n, from_tokens_nunique),
                style=dict(verticalAlign="top"),
            )
            td2 = html.Td(
                ["tokens", html.Br()]
                + [f"{from_tokens_n - len(shared_tokens)} ⬌ {to_tokens_n - len(shared_tokens)}"]
                + [html.Br(), html.Br(), "uniques", html.Br()]
                + [f"{from_tokens_nunique - len(shared_uniques)} ⬌ {to_tokens_nunique - len(shared_uniques)}"]
                + [html.Br(), html.Br(), "tree edit", html.Br(), f"{to_from_distance} ⬌ {from_to_distance}"]
            )
            td3 = html.Td(
                header_and_image(study, notation, to_slug, to_tokens_n, to_tokens_nunique),
                style=dict(verticalAlign="top"),
            )
            cmp = [html.Table([html.Tr([td1, td2, td3])], style=dict(width="100%", height="300px"))]
        elif from_slug != "":
            _, from_tokens_n, from_tokens_nunique = get_token_info(study, notation, from_slug)
            cmp = header_and_image(study, notation, from_slug, from_tokens_n, from_tokens_nunique)

        if from_slug != "":
            cmp += [diff_view(study, notation, from_slug, to_slug)]

    except Exception as e:
        print(repr(e))

    return (cmp, net, fig)


# if/when there is a PNG notation, just inline the imgext dict in the string
app.clientside_callback(
    """
    function(hoverData, hoverData2) {
        pieces = window.location.hash.split("/");
        study=pieces[1];
        if(!hoverData){
            if(!hoverData2){
                return [false, null, null, null];
            }
            hoverData = hoverData2;
            notation=pieces[5];
        }
        else {
            notation=pieces[2];
        }
        pt = hoverData["points"][0];
        bbox = pt["bbox"]
        slug = pt["hovertext"]
        return [true, bbox, "/assets/results/"+study+"/"+notation+"/img/"+slug+".svg", slug]
    }
    """,
    Output("tooltip", "show"),
    Output("tooltip", "bbox"),
    Output("tt_img", "src"),
    Output("tt_name", "children"),
    Input("figure", "hoverData"),
    Input("figure2", "hoverData"),
    prevent_initial_call=True,
)


if __name__ == "__main__":
    app.run_server(debug=True)
