# snk

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Quick-Genius/snk/main.yml?label=action&style=flat-square)](https://github.com/Quick-Genius/snk/actions/workflows/main.yml)
[![GitHub release](https://img.shields.io/github/release/Quick-Genius/snk.svg?style=flat-square)](https://github.com/Quick-Genius/snk/releases/latest)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-gopher-blue?logo=github&style=flat-square)](https://github.com/marketplace/actions/generate-gopher-animation-from-github-contribution-grid)
![type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)
![code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)

Generates a gopher animation from a github user contributions graph

<picture>
  <img
    alt="github contribution grid gopher animation"
    src="https://raw.githubusercontent.com/Quick-Genius/snk/output/gopher.svg"
  />
</picture>

Pull a github user's contribution graph.
Make it a gopher animation, generate a gopher path where the cells get eaten in an orderly fashion.

Generate an [svg](https://github.com/Quick-Genius/snk/raw/output/gopher.svg) image.

Available as github action. It can automatically generate a new image each day. Which makes for great [github profile readme](https://docs.github.com/en/free-pro-team@latest/github/setting-up-and-managing-your-github-profile/managing-your-profile-readme)

## Usage

### **github action**

```yaml
- uses: Quick-Genius/snk@v3
  with:
    # github user name to read the contribution graph from (**required**)
    # using action context var `github.repository_owner` or specified user
    github_user_name: ${{ github.repository_owner }}

    # list of files to generate.
    # one file per line. Each output can be customized with options as query string.
    #
    #  supported options:
    #  - palette:           A preset of color, one of [github, github-dark, github-light]
    #  - color_gopher:       Color of the gopher
    #  - color_dots:        Coma separated list of dots color.
    #                       The first one is 0 contribution, then it goes from the low contribution to the highest.
    #                       Exactly 5 colors are expected.
    #  - color_background:  Color of the background (for gif only)
    outputs: |
      dist/github-gopher.svg
      dist/github-gopher-dark.svg?palette=github-dark
      dist/ocean.gif?color_gopher=orange&color_dots=#bfd6f6,#8dbdff,#64a1f4,#4b91f1,#3c7dd9&color_background=#aaaaaa
```

[example with cron job](https://github.com/Quick-Genius/snk/blob/main/.github/workflows/gopher.yml)

### **svg**

If you are only interested in generating a svg (not a gif), consider using this faster action: `uses: Quick-Genius/snk/svg-only@v3`

### **dark mode**

![dark mode](https://github.com/user-attachments/assets/6b900b64-0cdc-43f0-a234-e11dba8e786e)

For **dark mode** support on github, use this [special syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#specifying-the-theme-an-image-is-shown-to) in your readme.

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="github-gopher-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="github-gopher.svg" />
  <img alt="github-gopher" src="github-gopher.svg" />
</picture>
```

### **interactive demo**

<a href="https://Quick-Genius.github.io/snk">
  <img height="300px" src="https://user-images.githubusercontent.com/1659820/121798244-7c86d700-cc25-11eb-8c1c-b8e65556ac0d.gif" ></img>
</a>

[Quick-Genius.github.io/snk](https://Quick-Genius.github.io/snk)

### **local**

```sh
npm install

npm run dev:demo
```

## Implementation

[solver algorithm](./packages/solver/README.md)

## Contribution Policy

This project does not accept pull request.

Reporting or fixing issues is appreciated, but change in the API or implementation should be discussed in issue first and is likely not going be greenlighted.
