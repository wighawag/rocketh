---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'rocketh'
  text: 'A deployment system for EVM Smart Contracts'
  tagline: Easy And Flexible Deployment for both development and production
  image:
    dark: /logo.svg
    light: /logo.svg
    alt: rocketh logo
  actions:
    - theme: brand
      text: harhdat-deploy
      link: https://rocketh.dev/hardhat-deploy/
    - theme: alt
      text: github
      link: https://github.com/wighawag/rocketh/#readme

features:
  - title: Declarative Deployments
    details: Define what state you want, rocketh takes care of the rest
  - title: Replicable Deployments
    details: Reuse your deployments in test or even in the browser
  - title: Modular
    details: At its core, rocketh only provide a save and read function for deployment, everything else is an external module
---
