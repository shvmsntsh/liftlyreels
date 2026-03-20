// Free royalty-free ambient audio loops per category
// Sources: Pixabay license (free for commercial use)
export const CATEGORY_AUDIO: Record<string, { url: string; label: string }> = {
  Mindset: {
    url: "https://cdn.pixabay.com/audio/2024/11/28/audio_3a5e5e2e83.mp3",
    label: "Motivational Ambient",
  },
  Gym: {
    url: "https://cdn.pixabay.com/audio/2024/10/08/audio_fd1ebf0fb7.mp3",
    label: "Workout Energy",
  },
  Books: {
    url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3",
    label: "Calm Lo-fi",
  },
  Diet: {
    url: "https://cdn.pixabay.com/audio/2024/09/10/audio_6e75479985.mp3",
    label: "Upbeat Positive",
  },
  Wellness: {
    url: "https://cdn.pixabay.com/audio/2024/04/23/audio_d0e4275b4c.mp3",
    label: "Nature Calm",
  },
};

export function getAudioForCategory(category: string) {
  return CATEGORY_AUDIO[category] ?? CATEGORY_AUDIO.Mindset;
}
