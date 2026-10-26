# -*- coding: utf-8 -*-
"""Assembles bfg_data.json: ship profiles + fleet lists + list rules that can be
checked by machine.

Rules are tied to the list's OWN sections ('Battleships', 'Cruisers', 'KROOZERS'),
not to the ships' TYPE field: in the book e.g. a 'heavy cruiser' has the stats of a
'Cruiser', so counting by the type field would give wrong results.

Run order:  extract.py -> lists.py -> build_data.py

The pipeline itself is the package data_pipeline/, one module per stage in
this order: inputs, ships, weapon_menu, rule_detectors, section_guard, page_refs, row_classes, row_texts, profile_types, inquisition_allies, races, special_rows, defences, section_kinds, chapters_marks, output.
Importing the last stage runs them all; --prove-guard is read there.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import data_pipeline.output  # noqa: F401  (runs the stages)
