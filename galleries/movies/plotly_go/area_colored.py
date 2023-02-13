import pandas as pd
import plotly.graph_objects as go

df = pd.read_csv("data/movies.csv")
df["Release Date"] = pd.to_datetime(df["Release Date"]).dt.year
df2 = df.pivot_table(
    index="Release Date", columns="MPAA Rating", values="Worldwide Gross", aggfunc="sum"
).fillna(0)

fig = go.Figure()
for label, column in df2.items():
    fig.add_trace(go.Scatter(name=label, x=df2.index, y=column, stackgroup=1))