## Getting Started

```bash
git clone git@github.com:chatman-media/timeline.git
cd timeline
```

В папку /public/videos/ поместите видео и аудио с миркофонов для монтажа.
В папку /public/music/ поместите аудиотреки

Можно на выбор использовать pnpm/yarn/deno/bun

Install ffmpeg ([brew](https://formulae.brew.sh/formula/ffmpeg))

```
brew install ffmpeg
ffmpeg -version
```

Install deps and run server

```bash
deno i # to install deps

deno task dev # to start dev server

deno lint --fix # to lint code

deno fmt # to format code

deno test # to run tests

deno outdated --recursive --update --latest # to update deps to latest versions (if needed)
```

## Development

This project uses pre-commit hooks to ensure code quality. To set up:

```bash
# Install pre-commit
brew install pre-commit

# Install the pre-commit hooks
pre-commit install
```
