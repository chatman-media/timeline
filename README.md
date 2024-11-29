## Getting Started

![Timeline Interface](/public/timeline.png)

```bash
git clone git@github.com:chatman-media/timeline.git
cd timeline
```

В папку /public/videos/ поместите видео и аудио с миркофонов для монтажа.
В папку /public/music/ поместите аудиотреки

Можно на выбор использовать pnpm/bun/deno

Install ffmpeg ([brew](https://formulae.brew.sh/formula/ffmpeg))

```
brew install ffmpeg
ffmpeg -version
```

Install deps and run server

```bash
pnpm i # to install deps

pnpm task dev # to start dev server

pnpm lint --fix # to lint code

pnpm fmt # to format code

pnpm test # to run tests

pnpm outdated --recursive --update --latest # to update deps to latest versions (if needed)
```

## Development

This project uses pre-commit hooks to ensure code quality. To set up:

```bash
# Install pre-commit
brew install pre-commit

# Install the pre-commit hooks
pre-commit install
```
