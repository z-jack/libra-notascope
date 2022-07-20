from itertools import permutations
from glob import glob
import os
import sys
from utils import slug_from_path
from lzma import compress
from multiprocessing import Pool


inpath = sys.argv[1]
pieces = inpath.split("/")
study = pieces[1]
system = pieces[2]
file_bytes = dict()
single_compressed_length = dict()
for fpath in glob(os.path.join(inpath, "*.*")):
    slug = slug_from_path(fpath)
    with open(fpath, "rb") as f:
        file_bytes[slug] = f.read()
    single_compressed_length[slug] = len(compress(file_bytes[slug]))


def cost(args):
    from_slug, to_slug = args
    a = single_compressed_length[from_slug]
    b = single_compressed_length[to_slug]
    ab = len(compress(file_bytes[from_slug] + file_bytes[to_slug]))
    return [study, system, from_slug, to_slug, str(int(1000 * (ab - min(a, b)) / max(a, b)))]


if __name__ == "__main__":
    with Pool(6) as p, open(f"results/{study}/{system}/ncd_costs.csv", "w") as f:
        for r in p.map(cost, permutations(file_bytes, 2)):
            print(",".join(r), file=f)
