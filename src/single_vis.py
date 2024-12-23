import dash_cytoscape as cyto
import plotly.graph_objects as go
from dash import dcc, html
from .scatter import get_scatter
from .dendro import get_dendro
from .network import get_network
from .distances import distances_df
from .distributions import token_rank, remoteness, get_remoteness_scatter
from .utils import img_path


def thumbnails(gallery, notation, distance, from_spec, to_spec, vis):
    df = distances_df(gallery=gallery).query(f"notation=='{notation}'")
    if from_spec:
        df = df.query(f"from_spec == '{from_spec}'")
    sorted_specs = (
        df.groupby("to_spec")[distance]
        .median()
        .reset_index()
        .sort_values(by=distance)
        .to_spec
    )
    thumbs = []
    if from_spec:
        thumbs += [
            html.P(
                from_spec, style=dict(marginBottom=0, marginTop="15px", fontSize="12px")
            ),
            html.Img(
                id=dict(
                    type="thumbnail", notation="", spec=from_spec, vis="neighbours"
                ),
                src=img_path(gallery, notation, from_spec),
                className="selected_thumb",
            ),
            html.Br(),
        ]

    for spec in sorted_specs:
        thumbs.append(
            html.Div(
                [
                    html.P(
                        spec,
                        style=dict(marginBottom=0, marginTop="15px", fontSize="12px"),
                    ),
                    html.Img(
                        id=dict(
                            type="thumbnail", notation="", spec=spec, vis="neighbours"
                        ),
                        src=img_path(gallery, notation, spec),
                        className="selected_thumb"
                        if spec == to_spec
                        else "regular_thumb",
                    ),
                ],
                style=dict(display="inline-block"),
            )
        )
    return html.Div(thumbs, className="thumbnails", style=dict(textAlign="center"))


vis_map = {
    "specs": None,
    "neighbours": thumbnails,
    "remoteness": remoteness,
    "dendro": get_dendro,
    "mst": get_network,
    "mds": get_network,
    "mds-mst": get_network,
    "spanner-1.5": get_network,
    "spanner-1": get_network,
    "tsne": get_scatter,
    "umap": get_scatter,
    "tokens": token_rank,
    "scatter": get_remoteness_scatter,
}
single_vis_types = list(vis_map.keys())


def get_vis(gallery, notation, distance, vis, from_spec, to_spec):
    return [vis_map[vis](gallery, notation, distance, from_spec, to_spec, vis)]


def wrap_single_vis(gallery, notation, distance, vis, from_spec, to_spec, suffix):
    vis_list = []
    for i, vis_out in enumerate(
        get_vis(gallery, notation, distance, vis, from_spec, to_spec)
    ):
        if isinstance(vis_out, go.Figure):
            vis_list.append(
                figure(
                    dict(type="figure", notation=notation, suffix=suffix, seq=str(i)),
                    vis_out,
                )
            )
        elif isinstance(vis_out, html.Div):
            vis_list.append(vis_out)
        else:
            vis_list.append(
                cytoscape(dict(type="network", suffix=suffix, seq=str(i)), vis_out)
            )
    return vis_list


def figure(id, fig):
    return dcc.Graph(
        id=id, figure=fig, config=dict(scrollZoom=True), clear_on_unhover=True
    )


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
            {"selector": ".inserted", "style": {"line-style": "dashed"}},
            {"selector": ".neighbour", "style": {"line-color": "red"}},
        ],
    )
