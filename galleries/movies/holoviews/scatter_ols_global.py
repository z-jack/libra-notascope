import holoviews as hv
import pandas as pd

hv.extension("bokeh")

df = pd.read_csv("data/movies.csv")
df["MPAA Rating"] = df["MPAA Rating"].fillna("Unknown")
df = df[["Production Budget", "Worldwide Gross", "MPAA Rating"]].dropna()

p = (
    hv.Dataset(df, ["Production Budget", "MPAA Rating"], "Worldwide Gross")
    .to(hv.Scatter)
    .overlay()
)
p *= hv.Slope.from_scatter(hv.Scatter(df, "Production Budget", "Worldwide Gross"))
p
