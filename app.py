# builtins
from collections import defaultdict
from datetime import datetime
from urllib.parse import urlencode, parse_qsl
import json

# plotly
from dash import Dash, html, dcc, Input, Output, State, callback_context, ALL
from dash_extensions import EventListener

# local
from src.utils import load_registry
from src.distances import distance_types
from src.single_vis import single_vis_types, wrap_single_vis
from src.pair_vis import distance_pair_vis_types, notation_pair_vis_types, wrap_pair_vis
from src.multi_vis import multi_vis_types, wrap_multi_vis
from src.details import details_view


print(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
registry = load_registry()
print("ready")

app = Dash(__name__, title="NotaScope", suppress_callback_exceptions=True)


app.layout = html.Div(
    [
        html.Div(id="content"),
        html.Div(
            id="logomark", children=[html.Img(src="/assets/logo.png"), "NotaScope"]
        ),
        dcc.Location(id="location"),
        dcc.Tooltip(
            id="tooltip",
            children=[
                html.Div(
                    [
                        html.P(
                            id="tt_name", style=dict(textAlign="center", display="none")
                        ),
                        html.Img(
                            id="tt_img",
                            style={
                                "width": "100px",
                                "height": "100px",
                                "object-fit": "cover",
                                "margin": 0,
                            },
                        ),
                    ],
                    style={
                        "width": "100px",
                        "height": "100px",
                        "padding": 0,
                        "margin": 0,
                    },
                )
            ],
            style={"opacity": 0.85, "padding": 0, "margin": 0},
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


def parse_hashpath(hashpath):
    return sanitize_state(parse_qsl(hashpath.lstrip("#")))


def make_hashpath(values):
    return "#" + urlencode(sanitize_state(values))


def sanitize_state(hashpath_values):
    state = defaultdict(str, hashpath_values)

    if state["gallery"] not in registry:
        state["gallery"] = "movies"

    if state["distance"] not in distance_types:
        state["distance"] = distance_types[0]

    notations = list(registry[state["gallery"]].keys())
    slugs = set()

    if state["notations"] not in notations and len(notations) == 1:
        state["notation"] = notations[0]

    if state["notation"] in notations:
        for s in registry[state["gallery"]][state["notation"]]["slugs"]:
            slugs.add(s)

        if state["vis"] not in single_vis_types:
            state["vis"] = single_vis_types[0]
    else:
        state["notation"] = ""
        if state["vis"] not in multi_vis_types:
            state["vis"] = multi_vis_types[0]

    if state["notation"] == "":
        state["compare"] = ""

    if state["compare"] in notations:
        for s in registry[state["gallery"]][state["compare"]]["slugs"]:
            slugs.add(s)
    elif state["compare"] not in single_vis_types + distance_types:
        state["compare"] = ""

    if not (
        (
            state["compare"] in distance_types
            and state["pair_vis"] in distance_pair_vis_types
        )
        or (
            state["compare"] in notations
            and state["pair_vis"] in notation_pair_vis_types
        )
    ):
        state["pair_vis"] = ""

    if state["from_slug"] not in slugs:
        state["from_slug"] = state["to_slug"] = ""
    elif state["to_slug"] not in slugs:
        state["to_slug"] = state["from_slug"]

    for k_to_del in [k for k in state if not state[k]]:
        del state[k_to_del]
    return state


@app.callback(
    Output("location", "hash"),
    Output(dict(type="network", suffix=ALL, seq=ALL), "tapNodeData"),
    Output(dict(type="network", suffix=ALL, seq=ALL), "tapEdgeData"),
    Input("selection", "data"),
    Input(dict(type="dropdown", id=ALL), "value"),
    Input(dict(type="network", suffix=ALL, seq=ALL), "tapNodeData"),
    Input(dict(type="network", suffix=ALL, seq=ALL), "tapEdgeData"),
    Input(dict(type="figure", suffix=ALL, seq=ALL, notation=ALL), "clickData"),
    Input(dict(type="thumbnail", slug=ALL, notation=ALL), "n_clicks"),
    Input(dict(type="thumbnail", slug=ALL, no_notation=ALL), "n_clicks"),
    State("event_listener", "event"),
)
def update_hashpath(
    selection,
    _dropdowns,
    node_data,
    edge_data,
    _fig_clicks,
    _img_clicks,
    _img_clicks2,
    event,
):
    shift_down = bool((dict(shiftKey=False) if not event else event)["shiftKey"])
    from_slug, to_slug = selection
    notation = ""
    if callback_context.triggered:
        *trig_id, trig_prop = callback_context.triggered[0]["prop_id"].split(".")
        trig_id = json.loads(".".join(trig_id))
        data = callback_context.triggered[0]["value"]

        if trig_prop == "tapEdgeData":
            # simple, write the edge
            from_slug = data["source"]
            to_slug = data["target"]
            node_data = [None] * len(node_data)

        clicked_slug = ""
        if trig_prop == "clickData":
            # clicking on a point in a figure
            if "customdata" in data["points"][0]:
                # token figures don't have customdata ATM
                clicked_slug = data["points"][0]["customdata"]
                if len(clicked_slug) == 1:
                    clicked_slug = clicked_slug[0]

        if trig_prop == "tapNodeData":
            # clicking on a node
            clicked_slug = data["id"]
            edge_data = [None] * len(edge_data)

        if trig_prop == "n_clicks":
            # clicking on an image
            clicked_slug = trig_id["slug"]
            if "notation" in trig_id:
                # gallery-wide thumbnails force a notation
                notation = trig_id["notation"]

        if clicked_slug:
            if shift_down:
                if clicked_slug in [from_slug, to_slug]:
                    # swap from/to
                    from_slug, to_slug = to_slug, from_slug
                else:
                    # base case: set to
                    to_slug = clicked_slug
            else:
                if to_slug == clicked_slug == from_slug:
                    # reset
                    from_slug = to_slug = ""
                else:
                    # base case: set from
                    from_slug = to_slug = clicked_slug

    hashpath_values = {"from_slug": from_slug, "to_slug": to_slug}
    for input in callback_context.inputs_list[1]:
        try:
            hashpath_values[input["id"]["id"]] = input["value"]
        except Exception as e:
            print(repr(e))
    if notation:
        hashpath_values["notation"] = notation
    hashpath = make_hashpath(hashpath_values)
    return hashpath, node_data, edge_data


def dropdown_opts(label, options, current):
    return [
        dict(
            disabled=True,
            label=html.Span(
                label,
                style=dict(fontWeight="bold", fontStyle="italic", margin="0 auto"),
            ),
            value="<>",
        )
    ] + [
        dict(
            label=x
            if x != current
            else html.Span(
                current,
                style=dict(color="grey"),
            ),
            value=x,
        )
        for x in options
    ]


@app.callback(
    Output("content", "children"),
    Input("location", "hash"),
)
def update_content(hashpath):
    state = parse_hashpath(hashpath)
    gallery = state["gallery"]
    notation = state["notation"]
    distance = state["distance"]
    vis = state["vis"]
    compare = state["compare"]
    from_slug = state["from_slug"]
    to_slug = state["to_slug"]
    pair_vis = state["pair_vis"]

    notation2 = distance2 = vis2 = None
    notations = [s for s in registry[gallery]]
    if compare:
        notation2 = notation
        distance2 = distance
        vis2 = vis
        if compare in notations:
            notation2 = compare
        if compare in single_vis_types:
            vis2 = compare
        if compare in distance_types:
            distance2 = compare

    comparisons = []
    if len(notations) > 1:
        comparisons += dropdown_opts("Notations", notations, notation)
    comparisons += dropdown_opts("Visualizations", single_vis_types, vis)
    comparisons += dropdown_opts("Distances", distance_types, distance)

    controls = {
        "Gallery": dcc.Dropdown(
            id=dict(id="gallery", type="dropdown"),
            value=gallery,
            options=[s for s in registry],
            clearable=False,
            style=dict(width="100px"),
            maxHeight=600,
        ),
        "Distance Function": dcc.Dropdown(
            id=dict(id="distance", type="dropdown"),
            value=distance,
            options=distance_types,
            clearable=False,
            style=dict(width="150px"),
            maxHeight=600,
        ),
        "Visualization": dcc.Dropdown(
            id=dict(id="vis", type="dropdown"),
            value=vis,
            options=single_vis_types if notation else multi_vis_types,
            clearable=False,
            style=dict(width="150px"),
            maxHeight=600,
        ),
        "Notation": dcc.Dropdown(
            id=dict(id="notation", type="dropdown"),
            value=notation,
            options=notations,
            clearable=len(notations) > 1,
            style=dict(width="160px"),
            maxHeight=600,
        ),
    }

    if notation:
        controls["Comparison"] = dcc.Dropdown(
            id=dict(id="compare", type="dropdown"),
            value=compare,
            options=comparisons,
            clearable=True,
            style=dict(width="175px"),
            maxHeight=600,
        )

    if compare in notations + distance_types:
        controls["Pair Visualization"] = dcc.Dropdown(
            id=dict(id="pair_vis", type="dropdown"),
            value=pair_vis,
            options=notation_pair_vis_types
            if compare in notations
            else distance_pair_vis_types,
            clearable=True,
            style=dict(width="175px"),
            maxHeight=600,
        )

    blocks = [
        html.Div(
            [
                html.Div(
                    [html.Span(k), html.Span(v, style=dict(textAlign="left"))],
                    style=dict(display="inline-block", textAlign="center"),
                )
                for k, v in controls.items()
            ],
            style=dict(margin="0 auto", gridColumn="1/3"),
        ),
        dcc.Store(id="selection", data=[from_slug, to_slug]),
    ]

    if not notation:
        blocks.append(
            html.Div(
                wrap_multi_vis(gallery, distance, vis),
                style=dict(gridColumn="1/3", textAlign="center"),
            )
        )
    if pair_vis:
        blocks.append(
            html.Div(
                html.Details(
                    [
                        html.Summary(
                            " ".join(
                                [
                                    "notation" if compare in notations else "distance",
                                    pair_vis,
                                    "pair visualization",
                                ]
                            )
                        ),
                        wrap_pair_vis(
                            gallery,
                            notation,
                            distance,
                            notation2,
                            distance2,
                            pair_vis,
                            from_slug,
                            to_slug,
                        ),
                    ],
                    open=True,
                    style=dict(width="800px", margin="0 auto", textAlign="center"),
                ),
                style=dict(gridColumn="1/3"),
            )
        )

    if notation:
        blocks.append(
            html.Div(
                html.Details(
                    [html.Summary(" ".join([notation, distance, vis]))]
                    + wrap_single_vis(
                        gallery, notation, distance, vis, from_slug, to_slug, "1"
                    ),
                    open=True,
                )
            ),
        )

    if compare:
        blocks.append(
            html.Div(
                html.Details(
                    [html.Summary(" ".join([notation2, distance2, vis2]))]
                    + wrap_single_vis(
                        gallery, notation2, distance2, vis2, from_slug, to_slug, "2"
                    ),
                    open=True,
                )
            )
        )

    if notation:
        blocks.append(details_view(gallery, notation, distance, from_slug, to_slug))

    if compare:
        blocks.append(details_view(gallery, notation2, distance2, from_slug, to_slug))

    return html.Div(className="wrapper", children=blocks)


# if/when there is a PNG notation, just inline the imgext dict in the string or in the ID dict
app.clientside_callback(
    """
    function(ignore) {
        trig = window.dash_clientside.callback_context.triggered;
        pt = trig.length > 0 && trig[0].value &&  trig[0].value["points"][0];
        if(!pt || !pt["customdata"]){
            return [false, null, null, null];
        }
        qs = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        gallery=qs.get('gallery');
        trig_id = JSON.parse(trig[0].prop_id.split('.')[0]);
        notation=trig_id.notation;
        slug = pt["customdata"];
        if(slug.length == 1) {
            slug = slug[0];
        }
        return [true,
                pt["bbox"],
                "/assets/results/"+gallery+"/"+notation+"/img/"+slug+".svg",
                slug];
    }
    """,
    Output("tooltip", "show"),
    Output("tooltip", "bbox"),
    Output("tt_img", "src"),
    Output("tt_name", "children"),
    Input(dict(type="figure", suffix=ALL, seq=ALL, notation=ALL), "hoverData"),
)


if __name__ == "__main__":
    app.run_server(debug=True)
