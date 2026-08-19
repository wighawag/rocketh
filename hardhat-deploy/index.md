---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "hardhat-deploy"
  text: "A Hardhat Plugin For Replicable Deployments And Easy Testing"
  tagline: Easy And Flexible Deployment for both development and production
  image:
    dark: /hardhat-deploy-logo.svg
    light: /hardhat-deploy-logo.svg
    alt: hardhat-deploy logo
  actions:
    - theme: brand
      text: Documentation
      link: /hardhat-deploy/documentation/introduction
    - theme: alt
      text: github
      link: https://github.com/wighawag/hardhat-deploy#readme

features:
  - title: Declarative Deployments
    details: Define what state you want, hardhat-deploy take care of the rest
  - title: Replicable
    details: Reuse your deployments in test or for other networks
  - title: Modular
    details: At its core, hardhat-deploy only provide a save and read function for deployment, everything else is an external module

# Without this, sharing a hardhat-deploy page falls back to the site-wide card in
# .vitepress/config.mts, which shows the rocketh mark and the rocketh tagline.
# Keys use `name` rather than `property` to match the site-wide convention.
head:
  - - meta
    - name: 'og:image'
      content: 'https://rocketh.dev/hardhat-deploy-preview.png'
  - - meta
    - name: 'twitter:image'
      content: 'https://rocketh.dev/hardhat-deploy-preview.png'
  - - meta
    - name: 'og:title'
      content: 'hardhat-deploy'
  - - meta
    - name: 'og:description'
      content: 'A Hardhat Plugin For Replicable Deployments And Easy Testing'
---
