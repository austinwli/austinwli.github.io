---
layout: archive
title: "Projects"
permalink: /projects/
author_profile: true
---

A collection of current and past projects. Previously high energy particle physics research in the DUNE collaboration, machine learning models for fair lending. Currently interested in quantum computing and algorithms for fair redistricting.

{% include base_path %}

{% for post in site.projects reversed %}
  {% include archive-single.html %}
{% endfor %}