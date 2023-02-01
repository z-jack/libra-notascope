import pandas as pd
import seaborn as sns

df = pd.read_csv("data/movies.csv")
df2 = df.groupby("Major Genre")["Production Budget"].sum().reset_index()

ax = sns.barplot(df2, x="Major Genre", y="Production Budget")
