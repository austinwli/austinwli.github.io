---
title: "DUNE Wire Tension"
collection: projects
permalink: /projects/2020-08-20-wire-tension
type: "Research Project"
venue: "Guenette Group"
date: 2020-08-20
---

This was a summer research project I conducted in the Guenette Group with the help of [Dr. Sebastien Prince](https://lppc.physics.harvard.edu/people/sebastien-prince) and [Professor Roxanne Guenette](https://www.physics.harvard.edu/people/facpages/guenette). The project aimed to tune hyperparameters in a novel wire tension measurement device in order to achieve two objectives: to minimize measurement time and have our extracted frequency within 1% of the true frequency.

## Background and goals
The Deep Underground Neutrino Experiment (DUNE) is a neutrino experiment under construction, with a near detector at Fermilab and a far detector at the Sanford Underground Research Facility that will observe neutrinos produced at Fermilab. These detectors use liquid argon time projection chambers (LArTPCs), which require large arrays of wires that carry electrical signals — created when electrons are displaced in the liquid argon — to reconstruct neutrino trajectories.

It is important that these wires are kept at a certain tension. Too little tension will cause the wires to sag (and create too much noise) and too much tension will risk the wires snapping. Because of the quantity of wires in DUNE, previous wire tension measurement methods will be too slow. The Guenette Group is currently working on a novel electrical wire tension measurement device; the novel method runs an AC current in adjacent wires to induce an electric field that oscillates the desired wire. The resonance frequency of the wire can then be extracted by changing the stimulus frequency and used to back-calculate the tension.

This device takes a number of system parameters and free parameters, i.e. the sampling rate, stimulus frequency interval, and the number of cycles. The goal of this project is to optimize these parameters such that the measurement time is minimized and that the reconstructed resonance frequency be within 1% of the true value.