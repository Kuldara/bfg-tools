"""The data pipeline, one module per stage (see build_data.py). Importing
the last stage, output, runs them all in order."""
STAGES = ["inputs", "ships", "weapon_menu", "rule_detectors", "section_guard", "page_refs", "row_classes", "row_texts", "profile_types", "inquisition_allies", "races", "special_rows", "defences", "section_kinds", "chapters_marks", "output"]
