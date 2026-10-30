#!/usr/bin/env bash
# Encode one persona clip for the web and print its voice timings for lib/personas.ts.
#
#   scripts/encode-clip.sh <source.mp4> <persona-id> <name> [--loop]
#   e.g. scripts/encode-clip.sh ~/Downloads/bella_button_1.mp4 bella ask-1
#
# Writes public/personas/<persona-id>/<name>.mp4 (H.264, plays everywhere, used on phones) and
# <name>.webm (VP9, smaller, used on desktop), both 1080×1080. With --loop the audio is dropped
# and a poster (<name>-poster.jpg, the first frame) is written too.
set -euo pipefail
src=$1 persona=$2 name=$3 loop=${4:-}
out=public/personas/$persona
mkdir -p "$out"
vf="scale=1080:1080:flags=lanczos"
audio_mp4=(-c:a aac -b:a 128k -ar 44100)
audio_webm=(-c:a libopus -b:a 96k)
if [[ $loop == --loop ]]; then audio_mp4=(-an); audio_webm=(-an); fi

ffmpeg -y -v error -i "$src" -vf "$vf" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset slow -movflags +faststart "${audio_mp4[@]}" "$out/$name.mp4"
ffmpeg -y -v error -i "$src" -vf "$vf" -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -deadline good -cpu-used 2 "${audio_webm[@]}" "$out/$name.webm"
if [[ $loop == --loop ]]; then
  ffmpeg -y -v error -i "$out/$name.mp4" -frames:v 1 -q:v 3 "$out/$name-poster.jpg"
  exit 0
fi

# Speaking stretches = the gaps between silences (-35dB for 0.25s or longer).
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/$name.mp4")
ffmpeg -v info -i "$out/$name.mp4" -af silencedetect=noise=-35dB:d=0.25 -f null - 2>&1 |
  grep -o 'silence_\(start\|end\): [0-9.]*' |
  awk -v dur="$dur" '
    BEGIN { t = 0; out = "" }
    /start/ { if ($2 - t > 0.05) out = out sprintf("[%.2f, %.2f], ", t, $2); t = -1 }
    /end/   { t = $2 }
    END {
      if (t >= 0 && dur - t > 0.05) out = out sprintf("[%.2f, %.2f], ", t, dur)
      sub(/, $/, "", out); printf "durationMs: %d, voice: [%s]\n", dur * 1000, out
    }'
