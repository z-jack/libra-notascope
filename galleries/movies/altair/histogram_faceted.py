import pandas as pd
import altair as alt

df = pd.read_csv("data/movies.csv")

chart = (
    alt.Chart(df)
    .mark_bar()
    .encode(
        x=alt.X("Production Budget").bin(),
        y="count()",
        color="MPAA Rating",
        facet=alt.Facet("Major Genre").columns(5),
    )
)