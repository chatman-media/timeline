## Getting Started

```bash
git clone git@github.com:chatman-media/timeline.git
cd timeline
```

Пока ожидается, что в папке /public/videos/ будут видео, коорые он анализирует. Если нет, то создайте папку и загрузите видео в нее.

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
