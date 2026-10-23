"""Turn the Vite single-file build into an Artifact page fragment."""
import re, sys
s = open(sys.argv[1]).read()
head = re.search(r"<head>(.*)</head>", s, re.S).group(1)
body = re.search(r"<body>(.*)</body>", s, re.S).group(1)
head = re.sub(r'<meta charset="utf-8"\s*/?>', "", head)
title = re.search(r"<title>.*?</title>", head).group(0)
open(sys.argv[2], "w").write(title + "\n" + head.replace(title, "") + "\n" + body)
