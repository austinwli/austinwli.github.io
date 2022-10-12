---
title: "Digital wire analyzer of mechanical tension, electrical continuity, and isolation"
collection: projects
permalink: /projects/wire-tension
type: "Research Project"
venue: "IEEE Transactions on Instrumentation & Measurement"
date: 2020-08-20
---

Research project conducted with the Guenette Group under the guidance of [Dr. Sebastien Prince](https://lppc.physics.harvard.edu/people/sebastien-prince) and [Professor Roxanne Guenette](https://www.physics.harvard.edu/people/facpages/guenette) in summer 2020. We aimed to tune hyperparameters in a novel wire tension measurement device in order to achieve two objectives: to minimize measurement time and have our extracted frequency within 1% of the true frequency.

## Current status
Publication pending in _IEEE Transactions on Instrumentation & Measurement_.

## Background and goals
The Deep Underground Neutrino Experiment (DUNE) is a neutrino experiment under construction, with a near detector at Fermilab and a far detector at the Sanford Underground Research Facility that will observe neutrinos produced at Fermilab. These detectors use liquid argon time projection chambers (LArTPCs), which require large arrays of wires that carry electrical signals — created when electrons are displaced in the liquid argon — to reconstruct neutrino trajectories.

It is important that these wires are kept at a certain tension. Too little tension will cause the wires to sag (and create too much noise) and too much tension will risk the wires snapping. Because of the quantity of wires in DUNE, previous wire tension measurement methods will be too slow. In April 2018, [Garcia-Gamez et al.](https://arxiv.org/abs/1804.05941) presented a novel wire tension measurement method. The Guenette Group was working on a device that implemented this method. The novel measurement involves running an AC current through adjacent wires on both sides of a test wire. This current induces an alternating electric field that oscillates the test wire. This wire will resonate at its natural frequency, and we can use this natural frequency to back-calculate the tension.

This device takes a number of system parameters and free parameters, i.e. the sampling rate, stimulus frequency interval, and the number of cycles. The goal of this project is to optimize these parameters such that the measurement time is minimized and that the reconstructed resonance frequency be within 1% of the true value.