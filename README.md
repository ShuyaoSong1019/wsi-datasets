# 🧩 Puzzle Logic — VQA & WSI & ROI Public Datasets Hub

Welcome to the **Puzzle Logic Public Pathology Dataset Hub**.
This repository hosts the public demonstration resources used in our research on **Whole Slide Image (WSI)** and **Region of Interest (ROI)** analysis, built upon the **UnPuzzle** framework.

🔗 **Project Paper**
**UnPuzzle: A Unified Framework for Pathology Image Analysis**
https://arxiv.org/abs/2503.03152

🔗 **Official Codebase**
https://github.com/Puzzle-AI/UnPuzzle

## 📌 Overview

Pathology image analysis has become a cornerstone of modern AI-assisted medical diagnosis. However, differences in preprocessing pipelines, model architectures, and dataset formats often hinder fair comparison and reproducibility.

**UnPuzzle** addresses these challenges by providing:

- A **unified, modular pipeline** for WSI and ROI analysis
- Standardized preprocessing (tiling → embedding → task configuration)
- Support for **self-supervised, multi-task, and multi-modal learning**
- Benchmarking across **100+ public pathology datasets**

This repository contains the **front-end visualization resources and metadata** used to demonstrate part of the datasets involved in UnPuzzle research.

## 📂 Repository Structure

```text
.
├── datasets.json   # Dataset metadata: sample lists, labels, sources
├── index.html      # Web interface for visualization
├── style.css       # Front-end style
└── script.js       # Interactive functions
```

### ✅ What is Included

- Dataset descriptions and annotations
- Example tiles / ROI previews
- Task labels used for benchmarking
- Front-end demo for browsing WSI & ROI samples

### ❌ What is NOT Included

- Full-resolution WSI files (gigapixel images)
- Protected clinical raw data

> Large original images can only be accessed through **controlled channels** in accordance with data governance and ethics policies.

## 🧪 Supported Tasks

The UnPuzzle framework supports a wide spectrum of pathology AI tasks.

### Slide-level (WSI)

- Cancer staging & grading
- Biomarker prediction (e.g., HER2, MSI)
- Survival regression
- Metastasis detection

### Tile / ROI-level

- Tissue classification
- Cell typing
- Tumor subtype recognition
- Patch-level representation learning

### Multi-modal

- Pathology VQA
- Vision-language modeling
- Chain-of-Thought inference

## ⚙ Usage

### 🌐 Access via GitHub Pages

This project is designed to be viewed directly through **GitHub Pages** without any additional configuration.

Open the webpage in your browser to explore:

- `datasets.json` metadata
- Example WSI / ROI previews
- Task labels and dataset descriptions
- Interactive browsing interface

**No installation is required.**

## 📖 Citation

If you use this resource in your research, please cite:

```text
Liao D., Chen S., Xi N., et al.
UnPuzzle: A Unified Framework for Pathology Image Analysis.
arXiv:2503.03152, 2025.
```

© Puzzle Logic / PuzzleAI. All rights reserved.
