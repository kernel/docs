# Kernel Documentation

<p align="left">
  <img alt="GitHub License" src="https://img.shields.io/github/license/onkernel/docs" />
  <a href="https://discord.gg/FBrveQRcud"><img src="https://img.shields.io/discord/1342243238748225556?logo=discord&logoColor=white&color=7289DA" alt="Discord" /></a>
  <a href="https://x.com/juecd__"><img src="https://img.shields.io/twitter/follow/juecd__" alt="Follow @juecd__" /></a>
  <a href="https://x.com/rfgarcia"><img src="https://img.shields.io/twitter/follow/rfgarcia" alt="Follow @rfgarcia" /></a>
</p>

This is the documentation for the Kernel platform. It's connected to [onkernel.com/docs](https://onkernel.com/docs).

## Code Snippets

Code samples in the docs are authored inline in MDX. Keep SDK examples aligned with the SDK repos, and follow the standards in `.docs/code-example-guide.md` when adding or editing examples.

When you add Go examples:

- Test complete snippets, or wrapped focused snippets, against the minimum released Go SDK version
  that supports the API you're documenting.
- Run `gofmt` on complete snippets and on wrapper files used to validate focused snippets before
  publishing.
- Note the validation you ran in the pull request description.

## Local Development

To run the docs locally, you can use the following command:

```bash
bun install
bun dev
```

## Contributing

We welcome contributions to the documentation. Please feel free to submit a pull request with your changes. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
