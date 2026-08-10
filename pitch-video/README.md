# SPulse pitch video

This folder contains the reusable source for the GrantFox pitch video.

Run the renderer from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File pitch-video/render.ps1
```

The renderer captures the current static website, generates narration with the
Microsoft Ezinne Neural Nigerian English voice, creates synchronized captions,
and writes:

- `SPulse-GrantFox-Pitch.mp4`
- `captions.srt`

The video is designed for a 1920x1080 application upload. Review the rendered
video before submission and confirm the application does not impose a shorter
duration or smaller file-size limit.

The renderer requires `edge-tts` for neural narration:

```powershell
python -m pip install edge-tts
```
