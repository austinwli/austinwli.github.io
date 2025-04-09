---
title: zrp
date: 2021-08-01
repo: zestai/zrp
topics: ["Python", "Machine Learning"]
lead: A more accurate geography-agnostic race predictor.
image: zrp.png
---

While working at Zest AI, I developed an open-source machine learning algorithm
for race and ethnicity estimation using full name and home address as inputs.
The goal was to improve upon the most widely used racial and ethnic estimation
method — Bayesian Improved Surname Geocoding (BISG), developed by RAND
Corporation in 2009 — to better analyze racial equity and outcomes in
healthcare, finance, and other cases where race or ethnicity data need to be
imputed.

Built with gradient boosting, trained on voter registration data from North
Carolina and Florida, validated on a national sample using adjusted tract-level
American Community Survey (ACS) data. Found that compared to BISG, the `zrp`
correctly identifies 25% more African Americans as African American, 35% fewer
African Americans as non-African American, and 60% fewer White Americans as
non-White.

**Links: [GitHub](https://github.com/zestai/zrp)**
