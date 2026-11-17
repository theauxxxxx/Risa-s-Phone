
const $ = id => document.getElementById(id);

const phone = $("phone");
const lockScreen = $("lockScreen");
const homeScreen = $("homeScreen");
const controlCenter = $("controlCenter");
const appWindow = $("appWindow");
const wallpaperMenu = $("wallpaperMenu");
const audio = $("musicAudio");

let currentApp = "";
let cameraStream = null;
let enteredPasscode = "";
let currentTrack = 0;
let isPlaying = false;
let currentNoteId = null;
let editingContactId = null;
let selectedContactPhoto = "";
let selectedProfileId = null;

const PHONE_PASSCODE = "0224";

const appNames = {
  photos: "Photos",
  music: "Spotify",
  notes: "Notes",
  contacts: "Contacts",
  messages: "Messages",
  messenger: "Messenger",
  maps: "Maps",
  phone: "Phone",
  settings: "Settings",
  camera: "Camera"
};


/* =====================================
   MUSIC LIBRARY
===================================== */

const tracks = [
  {
    title: "A Perfect Christmas",
    artist: "Jose Mari Chan",
    audio: "assets/music/song1.mp3",
    cover: "assets/album/cover1.jpeg"
  },
  {
    title: "Bibingka",
    artist: "Ben & Ben",
    audio: "assets/music/song2.mp3",
    cover: "assets/album/cover2.jpeg"
  },
  {
    title: "Song 3",
    artist: "Music Library",
    audio: "assets/music/song3.mp3",
    cover: "assets/album/cover3.jpeg"
  },
  {
    title: "Kampana ng Simbahan",
    artist: "Music Library",
    audio: "assets/music/song4.mp3",
    cover: "assets/album/cover4.jpeg"
  }
];

const spotifyTracks = [
  "0a6MYHhBrSpRFEffkat6R5",
  "3nmRSlzR7xtAo95GjfIahZ",
  "6fu6uFC8eSFWnEcZnkIUdJ",
  "3WJNclt6udgjcPiSy0hMNb"
];


/* =====================================
   CLOCK
===================================== */

function updateClock() {
  const now = new Date();

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  $("homeTime").textContent = time;
  $("lockTime").textContent = time;
  $("lockDate").textContent = date;
}

updateClock();
setInterval(updateClock, 1000);


/* =====================================
   PASSCODE
===================================== */

function updatePasscodeDots() {
  document.querySelectorAll("#passcodeDots span")
    .forEach((dot, index) => {
      dot.classList.toggle(
        "filled",
        index < enteredPasscode.length
      );
    });
}

function showPasscode() {
  $("passcodePanel").classList.remove("hidden");
  $("lockBottom").classList.add("hidden");

  enteredPasscode = "";
  updatePasscodeDots();
  $("passcodeError").textContent = "";
}

function hidePasscode() {
  $("passcodePanel").classList.add("hidden");
  $("lockBottom").classList.remove("hidden");

  enteredPasscode = "";
  updatePasscodeDots();
}

function unlockPhone() {
  lockScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  hidePasscode();
}

function lockPhone() {
  closeApp();
  closeControlCenter();
  closeWallpaperMenu();

  homeScreen.classList.add("hidden");
  lockScreen.classList.remove("hidden");

  hidePasscode();
}

document.querySelectorAll("[data-digit]").forEach(button => {
  button.addEventListener("click", () => {
    if (enteredPasscode.length >= 4) return;

    enteredPasscode += button.dataset.digit;
    updatePasscodeDots();

    if (enteredPasscode.length === 4) {
      if (enteredPasscode === PHONE_PASSCODE) {
        $("passcodeError").textContent = "Unlocked ♡";
        setTimeout(unlockPhone, 250);
      } else {
        $("passcodeError").textContent =
          "Incorrect passcode. Try again.";

        setTimeout(() => {
          enteredPasscode = "";
          updatePasscodeDots();
        }, 650);
      }
    }
  });
});

$("deleteDigit").addEventListener("click", () => {
  enteredPasscode = enteredPasscode.slice(0, -1);
  updatePasscodeDots();
  $("passcodeError").textContent = "";
});

lockScreen.addEventListener("click", event => {
  if (event.target.closest("button")) return;

  if ($("passcodePanel").classList.contains("hidden")) {
    showPasscode();
  }
});

$("lockFlash").addEventListener("click", () => {
  $("lockFlash").classList.toggle("active");
});

$("lockCamera").addEventListener("click", showPasscode);


/* =====================================
   SWIPE NAVIGATION
===================================== */

let touchStartY = 0;
let touchStartX = 0;

phone.addEventListener("touchstart", event => {
  touchStartY = event.changedTouches[0].screenY;
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

phone.addEventListener("touchend", event => {
  const endY = event.changedTouches[0].screenY;
  const endX = event.changedTouches[0].screenX;

  const differenceY = endY - touchStartY;
  const differenceX = endX - touchStartX;

  if (
    differenceY < -65 &&
    !lockScreen.classList.contains("hidden") &&
    $("passcodePanel").classList.contains("hidden")
  ) {
    showPasscode();
    return;
  }

  if (
    differenceY < -80 &&
    !appWindow.classList.contains("hidden")
  ) {
    closeApp();
    return;
  }

  if (
    differenceY > 65 &&
    touchStartY < 65 &&
    !homeScreen.classList.contains("hidden")
  ) {
    openControlCenter();
  }

  if (
    Math.abs(differenceX) > 100 &&
    !appWindow.classList.contains("hidden") &&
    differenceX > 0 &&
    currentApp === "messages"
  ) {
    closeApp();
  }
}, { passive: true });


/* =====================================
   APP NAVIGATION
===================================== */

function openApp(name) {
  currentApp = name;

  appWindow.classList.remove("hidden");
  $("appTitle").textContent = appNames[name] || name;

  document.querySelectorAll(".app-page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = $("page" + name.charAt(0).toUpperCase() + name.slice(1));

  if (page) {
    page.classList.remove("hidden");
  } else {
    $("pageOther").classList.remove("hidden");
  }

  if (name === "photos") renderPhotos();
  if (name === "music") {
    renderPlaylist();
    initializeSpotify();
  }
  if (name === "notes") initializeNotes();
  if (name === "contacts") showContactsList();
}

function closeApp() {
  appWindow.classList.add("hidden");
  $("photoViewer").classList.add("hidden");

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  $("cameraVideo").srcObject = null;
}

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    openApp(button.dataset.open);
  });
});

$("backHome").addEventListener("click", closeApp);
$("closeApp").addEventListener("click", closeApp);


/* =====================================
   PHOTOS
===================================== */

const photos = Array.from(
  { length: 11 },
  (_, index) => `assets/photos/photo${index + 1}.jpeg`
);

function renderPhotos() {
  const gallery = $("photoGallery");
  gallery.innerHTML = "";

  photos.forEach((src, index) => {
    const button = document.createElement("button");
    const img = document.createElement("img");

    img.src = src;
    img.alt = `Photo ${index + 1}`;
    img.loading = "lazy";

    img.onerror = () => button.remove();

    button.appendChild(img);

    button.addEventListener("click", () => {
      showPhoto(src);
    });

    gallery.appendChild(button);
  });
}

function showPhoto(src) {
  $("largePhoto").src = src;
  $("photoViewer").classList.remove("hidden");
}

$("closePhotoViewer").addEventListener("click", () => {
  $("photoViewer").classList.add("hidden");
});

$("photoWidgetImage").src = photos[0];


/* =====================================
   LOCAL MUSIC PLAYER
===================================== */

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function updatePlayButtons() {
  $("playTrack").textContent = isPlaying ? "Ⅱ" : "▶";
  $("islandPlay").textContent = isPlaying ? "Ⅱ" : "▶";
  $("widgetPlayIcon").textContent = isPlaying ? "Ⅱ" : "▶";
}

function updateMusicDisplay() {
  const track = tracks[currentTrack];

  $("playerArt").src = track.cover;
  $("playerTitle").textContent = track.title;
  $("playerArtist").textContent = track.artist;

  $("musicWidgetImage").src = track.cover;
  $("widgetSongTitle").textContent = track.title;
  $("widgetSongArtist").textContent = track.artist;

  $("islandCover").src = track.cover;
  $("islandTitle").textContent = track.title;
  $("islandArtist").textContent = track.artist;

  $("musicProgress").value = 0;
  $("currentTime").textContent = "0:00";
  $("duration").textContent = "0:00";

  renderPlaylist();
}

function loadTrack(index, autoplay = false) {
  currentTrack = (index + tracks.length) % tracks.length;

  audio.pause();
  audio.src = tracks[currentTrack].audio;
  audio.load();

  isPlaying = false;

  updateMusicDisplay();
  updatePlayButtons();

  if (autoplay) playMusic();
}

async function playMusic() {
  try {
    if (!audio.src) {
      loadTrack(currentTrack);
    }

    await audio.play();

    isPlaying = true;
    updatePlayButtons();

    $("dynamicIsland").classList.add("expanded");
    renderPlaylist();

  } catch (error) {
    isPlaying = false;
    updatePlayButtons();

    alert("Unable to play this song. Check the MP3 file and its location.");
  }
}

function pauseMusic() {
  audio.pause();
  isPlaying = false;

  updatePlayButtons();
  renderPlaylist();
}

function toggleMusic() {
  if (isPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function nextTrack() {
  loadTrack(currentTrack + 1, true);
}

function previousTrack() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    loadTrack(currentTrack - 1, true);
  }
}

function renderPlaylist() {
  const playlist = $("playlist");
  if (!playlist) return;

  playlist.innerHTML = "";

  tracks.forEach((track, index) => {
    const item = document.createElement("button");
    item.className = "playlist-item";

    if (index === currentTrack) {
      item.classList.add("active");
    }

    const image = document.createElement("img");
    image.src = track.cover;
    image.alt = "";

    const info = document.createElement("span");
    const title = document.createElement("strong");
    const artist = document.createElement("small");

    title.textContent = track.title;
    artist.textContent = track.artist;

    info.append(title, artist);
    item.append(image, info);

    const symbol = document.createElement("span");
    symbol.textContent =
      index === currentTrack && isPlaying ? "♫" : "♪";

    item.appendChild(symbol);

    item.addEventListener("click", () => {
      loadTrack(index, true);
    });

    playlist.appendChild(item);
  });
}

$("playTrack").addEventListener("click", toggleMusic);
$("islandPlay").addEventListener("click", event => {
  event.stopPropagation();
  toggleMusic();
});

$("prevTrack").addEventListener("click", previousTrack);
$("nextTrack").addEventListener("click", nextTrack);

audio.addEventListener("play", () => {
  isPlaying = true;
  updatePlayButtons();
});

audio.addEventListener("pause", () => {
  isPlaying = false;
  updatePlayButtons();
});

audio.addEventListener("ended", () => {
  nextTrack();
});

audio.addEventListener("loadedmetadata", () => {
  $("duration").textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  $("musicProgress").value =
    (audio.currentTime / audio.duration) * 100;

  $("currentTime").textContent =
    formatTime(audio.currentTime);
});

$("musicProgress").addEventListener("input", event => {
  if (audio.duration) {
    audio.currentTime =
      (event.target.value / 100) * audio.duration;
  }
});

$("dynamicIsland").addEventListener("click", () => {
  $("dynamicIsland").classList.toggle("expanded");
});


/* =====================================
   SPOTIFY
===================================== */

function initializeSpotify() {
  const embed = $("spotifyEmbed");
  const buttons = document.querySelectorAll(".spotify-track");
  const openLink = $("openSpotify");

  if (!embed || !openLink) return;

  function selectSpotifyTrack(index) {
    const trackId = spotifyTracks[index];
    if (!trackId) return;

    embed.src =
      "https://open.spotify.com/embed/track/" +
      trackId +
      "?utm_source=generator&theme=0";

    openLink.href =
      "https://open.spotify.com/track/" + trackId;

    buttons.forEach((button, i) => {
      button.classList.toggle("active", i === index);
    });
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      selectSpotifyTrack(Number(button.dataset.spotifyTrack));
    });
  });

  selectSpotifyTrack(0);
}


/* =====================================
   NOTES APP
===================================== */

const NOTES_STORAGE_KEY = "risa_notes_collection_v2";
let notes = [];

function makeId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function loadNotesData() {
  try {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      notes = Array.isArray(parsed) ? parsed : [];
    } else {
      // Migrate the original single-note textarea.
      const oldNote = localStorage.getItem("risaNotes");

      if (oldNote && oldNote.trim()) {
        notes = [{
          id: makeId(),
          title: "My Notes",
          body: oldNote,
          updated: new Date().toISOString()
        }];

        saveNotesData();
      }
    }
  } catch (error) {
    console.error("Unable to load notes:", error);
    notes = [];
  }
}

function saveNotesData() {
  try {
    localStorage.setItem(
      NOTES_STORAGE_KEY,
      JSON.stringify(notes)
    );
    return true;
  } catch (error) {
    console.error("Unable to save notes:", error);
    $("noteStatus").textContent =
      "Storage is full. Try removing large notes.";
    return false;
  }
}

function initializeNotes() {
  loadNotesData();

  $("notesSearch").value = "";
  renderNotesList();

  if (notes.length) {
    selectNote(notes[0].id);
  } else {
    createNewNote();
  }
}

function renderNotesList(filter = "") {
  const list = $("notesList");
  list.innerHTML = "";

  const query = filter.toLowerCase().trim();

  const filtered = notes
    .filter(note =>
      (note.title + " " + note.body)
        .toLowerCase()
        .includes(query)
    )
    .sort((a, b) =>
      new Date(b.updated) - new Date(a.updated)
    );

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = notes.length
      ? "No matching notes found."
      : "No notes yet. Create your first note ♡";
    list.appendChild(empty);
    return;
  }

  filtered.forEach(note => {
    const button = document.createElement("button");
    button.className = "note-list-item";

    if (note.id === currentNoteId) {
      button.classList.add("active");
    }

    const title = document.createElement("strong");
    title.textContent = note.title || "Untitled";

    const preview = document.createElement("small");
    preview.textContent =
      note.body.slice(0, 65).replace(/\s+/g, " ") || "No additional text";

    button.append(title, preview);

    button.addEventListener("click", () => {
      saveCurrentNote();
      selectNote(note.id);
    });

    list.appendChild(button);
  });
}

function selectNote(id) {
  const note = notes.find(item => item.id === id);
  if (!note) return;

  currentNoteId = id;

  $("noteTitle").value = note.title;
  $("noteBody").value = note.body;
  $("noteStatus").textContent = "Saved ♡";

  renderNotesList($("notesSearch").value);
}

function createNewNote() {
  saveCurrentNote();

  const note = {
    id: makeId(),
    title: "",
    body: "",
    updated: new Date().toISOString()
  };

  notes.unshift(note);
  currentNoteId = note.id;

  saveNotesData();

  $("noteTitle").value = "";
  $("noteBody").value = "";
  $("noteStatus").textContent = "New note";

  renderNotesList($("notesSearch").value);
  $("noteTitle").focus();
}

function saveCurrentNote() {
  if (!currentNoteId) return;

  const note = notes.find(item => item.id === currentNoteId);
  if (!note) return;

  note.title = $("noteTitle").value.trim();
  note.body = $("noteBody").value;
  note.updated = new Date().toISOString();

  const saved = saveNotesData();

  $("noteStatus").textContent = saved
    ? "Saved automatically ♡"
    : "Unable to save.";

  renderNotesList($("notesSearch").value);
}

function deleteCurrentNote() {
  if (!currentNoteId) return;

  const note = notes.find(item => item.id === currentNoteId);
  if (!note) return;

  if (!confirm(`Delete "${note.title || "Untitled"}"?`)) return;

  notes = notes.filter(item => item.id !== currentNoteId);
  currentNoteId = null;

  saveNotesData();

  if (notes.length) {
    selectNote(notes[0].id);
  } else {
    createNewNote();
  }

  renderNotesList($("notesSearch").value);
}

$("newNote").addEventListener("click", createNewNote);
$("saveNote").addEventListener("click", saveCurrentNote);
$("deleteNote").addEventListener("click", deleteCurrentNote);

$("noteTitle").addEventListener("input", saveCurrentNote);
$("noteBody").addEventListener("input", saveCurrentNote);

$("notesSearch").addEventListener("input", event => {
  renderNotesList(event.target.value);
});

$("notesImport").addEventListener("change", async event => {
  const files = Array.from(event.target.files || []);

  for (const file of files) {
    try {
      const text = await file.text();

      notes.unshift({
        id: makeId(),
        title: file.name.replace(/\.(txt|md)$/i, ""),
        body: text,
        updated: new Date().toISOString()
      });

    } catch (error) {
      console.error("Unable to import note:", error);
    }
  }

  if (files.length) {
    if (!saveNotesData()) {
      alert("Some notes could not be saved. Your browser storage may be full.");
    }

    renderNotesList();

    if (notes.length) {
      selectNote(notes[0].id);
    }

    alert(`${files.length} note file(s) imported ♡`);
  }

  event.target.value = "";
});


/* =====================================
   CONTACTS APP
===================================== */

const CONTACTS_STORAGE_KEY = "risa_phone_contacts_v1";
let contacts = [];

function loadContacts() {
  try {
    const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
    contacts = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(contacts)) contacts = [];

  } catch (error) {
    console.error("Unable to load contacts:", error);
    contacts = [];
  }
}

function saveContacts() {
  try {
    localStorage.setItem(
      CONTACTS_STORAGE_KEY,
      JSON.stringify(contacts)
    );
    return true;

  } catch (error) {
    alert(
      "Unable to save contact. Your browser storage may be full. Try using a smaller photo."
    );
    return false;
  }
}

function contactFullName(contact) {
  return `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
    || "Unnamed Contact";
}

function contactInitials(contact) {
  const first = (contact.firstName || "").trim().charAt(0);
  const last = (contact.lastName || "").trim().charAt(0);

  return (first + last).toUpperCase() || "♡";
}

function showContactsList() {
  $("contactsList").classList.remove("hidden");
  $("contactEditor").classList.add("hidden");
  $("contactProfile").classList.add("hidden");

  $("contactsSearch").classList.remove("hidden");
  $("contactsSearch").value = "";

  renderContacts();
}

function renderContacts(filter = "") {
  const list = $("contactsList");
  list.innerHTML = "";

  const query = filter.toLowerCase().trim();

  const filtered = contacts
    .filter(contact => {
      const searchable = [
        contact.firstName,
        contact.lastName,
        contact.phone,
        contact.email
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    })
    .sort((a, b) =>
      contactFullName(a).localeCompare(contactFullName(b))
    );

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    empty.textContent = "♡";

    const message = document.createElement("p");
    message.textContent = contacts.length
      ? "No contacts found."
      : "Your contacts will appear here. Add someone special ♡";

    empty.appendChild(message);
    list.appendChild(empty);
    return;
  }

  filtered.forEach(contact => {
    const button = document.createElement("button");
    button.className = "contact-list-item";

    const avatar = document.createElement("div");
    avatar.className = "contact-avatar";

    if (contact.photo) {
      const image = document.createElement("img");
      image.src = contact.photo;
      image.alt = "";
      avatar.appendChild(image);
    } else {
      avatar.textContent = contactInitials(contact);
    }

    const info = document.createElement("div");
    info.className = "contact-list-info";

    const name = document.createElement("strong");
    name.textContent = contactFullName(contact);

    const phoneNumber = document.createElement("small");
    phoneNumber.textContent = contact.phone || contact.email || "No contact details";

    info.append(name, phoneNumber);
    button.append(avatar, info);

    button.addEventListener("click", () => {
      showContactProfile(contact.id);
    });

    list.appendChild(button);
  });
}

$("contactsSearch").addEventListener("input", event => {
  renderContacts(event.target.value);
});

function openContactEditor(contact = null) {
  editingContactId = contact ? contact.id : null;
  selectedContactPhoto = contact ? contact.photo || "" : "";

  $("contactsList").classList.add("hidden");
  $("contactProfile").classList.add("hidden");
  $("contactsSearch").classList.add("hidden");
  $("contactEditor").classList.remove("hidden");

  $("contactEditorHeading").textContent =
    contact ? "Edit Contact" : "New Contact";

  $("contactFirstName").value = contact?.firstName || "";
  $("contactLastName").value = contact?.lastName || "";
  $("contactPhone").value = contact?.phone || "";
  $("contactEmail").value = contact?.email || "";
  $("contactBirthday").value = contact?.birthday || "";
  $("contactExtra").value = contact?.extra || "";

  renderContactPhotoPreview();
}

function renderContactPhotoPreview() {
  const preview = $("contactPhotoPreview");
  preview.innerHTML = "";

  if (selectedContactPhoto) {
    const image = document.createElement("img");
    image.src = selectedContactPhoto;
    image.alt = "Contact photo";
    preview.appendChild(image);
  } else {
    preview.textContent = "＋";
  }
}

function resizeContactPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 500;
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

$("contactPhotoInput").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    return;
  }

  try {
    selectedContactPhoto = await resizeContactPhoto(file);
    renderContactPhotoPreview();
  } catch (error) {
    alert("Unable to load that photo.");
  }

  event.target.value = "";
});

$("removeContactPhoto").addEventListener("click", () => {
  selectedContactPhoto = "";
  renderContactPhotoPreview();
});

$("addContact").addEventListener("click", () => {
  openContactEditor();
});

$("cancelContact").addEventListener("click", () => {
  if (selectedProfileId) {
    showContactProfile(selectedProfileId);
  } else {
    showContactsList();
  }
});

$("saveContact").addEventListener("click", () => {
  const firstName = $("contactFirstName").value.trim();
  const lastName = $("contactLastName").value.trim();
  const phoneNumber = $("contactPhone").value.trim();
  const email = $("contactEmail").value.trim();

  if (!firstName && !lastName) {
    alert("Please enter at least a first or last name.");
    return;
  }

  const existing = contacts.find(
    contact => contact.id === editingContactId
  );

  const contact = {
    id: editingContactId || makeId(),
    firstName,
    lastName,
    phone: phoneNumber,
    email,
    birthday: $("contactBirthday").value,
    extra: $("contactExtra").value.trim(),
    photo: selectedContactPhoto,
    created: existing?.created || new Date().toISOString(),
    updated: new Date().toISOString()
  };

  if (editingContactId) {
    contacts = contacts.map(item =>
      item.id === editingContactId ? contact : item
    );
  } else {
    contacts.push(contact);
  }

  if (!saveContacts()) return;

  selectedProfileId = contact.id;
  showContactProfile(contact.id);
});

function showContactProfile(id) {
  const contact = contacts.find(item => item.id === id);
  if (!contact) {
    showContactsList();
    return;
  }

  selectedProfileId = id;

  $("contactsList").classList.add("hidden");
  $("contactEditor").classList.add("hidden");
  $("contactsSearch").classList.add("hidden");
  $("contactProfile").classList.remove("hidden");

  $("profileName").textContent = contactFullName(contact);

  $("profileDetails").textContent =
    contact.phone || contact.email || "Contact details";

  const photo = $("profilePhoto");
  photo.innerHTML = "";

  if (contact.photo) {
    const image = document.createElement("img");
    image.src = contact.photo;
    image.alt = contactFullName(contact);
    photo.appendChild(image);
  } else {
    photo.textContent = contactInitials(contact);
  }

  $("profileCall").href = contact.phone
    ? "tel:" + contact.phone.replace(/[^\d+]/g, "")
    : "#";

  $("profileMessage").href = contact.phone
    ? "sms:" + contact.phone.replace(/[^\d+]/g, "")
    : "#";

  $("profileEmail").href = contact.email
    ? "mailto:" + contact.email
    : "#";

  $("profileCall").style.opacity = contact.phone ? "1" : ".35";
  $("profileMessage").style.opacity = contact.phone ? "1" : ".35";
  $("profileEmail").style.opacity = contact.email ? "1" : ".35";

  const info = $("profileInfo");
  info.innerHTML = "";

  function addInfo(label, value) {
    if (!value) return;

    const row = document.createElement("div");
    row.className = "profile-info-row";

    const heading = document.createElement("small");
    heading.textContent = label;

    const content = document.createElement("strong");
    content.textContent = value;

    row.append(heading, content);
    info.appendChild(row);
  }

  addInfo("Phone", contact.phone);
  addInfo("Email", contact.email);
  addInfo("Birthday", contact.birthday);
  addInfo("Notes", contact.extra);
}

$("profileBack").addEventListener("click", showContactsList);

$("editContact").addEventListener("click", () => {
  const contact = contacts.find(
    item => item.id === selectedProfileId
  );

  if (contact) openContactEditor(contact);
});

$("removeContact").addEventListener("click", () => {
  const contact = contacts.find(
    item => item.id === selectedProfileId
  );

  if (!contact) return;

  if (!confirm(`Delete ${contactFullName(contact)}?`)) return;

  contacts = contacts.filter(
    item => item.id !== selectedProfileId
  );

  saveContacts();
  selectedProfileId = null;
  showContactsList();
});

loadContacts();


/* =====================================
   CONTROL CENTER
===================================== */

function openControlCenter() {
  if (!homeScreen.classList.contains("hidden")) {
    controlCenter.classList.remove("hidden");
  }
}

function closeControlCenter() {
  controlCenter.classList.add("hidden");
}

$("closeControl").addEventListener("click", closeControlCenter);

document.querySelectorAll("[data-toggle]").forEach(button => {
  button.addEventListener("click", () => {
    button.classList.toggle("active");
  });
});

$("brightnessSlider").addEventListener("input", event => {
  const brightness = event.target.value / 100;
  phone.style.filter = `brightness(${brightness})`;
});

$("volumeSlider").addEventListener("input", event => {
  audio.volume = event.target.value / 100;
});

$("ccWallpaper").addEventListener("click", () => {
  closeControlCenter();
  openWallpaperMenu();
});

$("settingsControl").addEventListener("click", openControlCenter);


/* =====================================
   WALLPAPER
===================================== */

const wallpaperStyles = {
  pink: "linear-gradient(145deg,#f6b8d0,#f8e4ed)",
  blue: "linear-gradient(145deg,#b9d9f7,#e8efff)",
  purple: "linear-gradient(145deg,#c8b8f5,#f0e4fa)",
  yellow: "linear-gradient(145deg,#f8e5a9,#fff5d5)"
};

function applyWallpaper(value) {
  if (value === "original") {
    phone.style.background =
      'url("assets/wallpaper.jpeg") center / cover no-repeat';
  } else if (wallpaperStyles[value]) {
    phone.style.background = wallpaperStyles[value];
  }

  localStorage.setItem("risaWallpaper", value);
  localStorage.removeItem("risaCustomWallpaper");
}

function openWallpaperMenu() {
  wallpaperMenu.classList.remove("hidden");
}

function closeWallpaperMenu() {
  wallpaperMenu.classList.add("hidden");
}

$("closeWallpaper").addEventListener("click", closeWallpaperMenu);
$("settingsWallpaper").addEventListener("click", openWallpaperMenu);

document.querySelectorAll("[data-wallpaper]").forEach(button => {
  button.addEventListener("click", () => {
    applyWallpaper(button.dataset.wallpaper);
    closeWallpaperMenu();
  });
});

$("wallpaperUpload").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    phone.style.background =
      `url("${reader.result}") center / cover no-repeat`;

    try {
      localStorage.setItem("risaCustomWallpaper", reader.result);
      localStorage.removeItem("risaWallpaper");
      closeWallpaperMenu();
    } catch (error) {
      alert("That wallpaper is too large to save in browser storage.");
    }
  };

  reader.readAsDataURL(file);
  event.target.value = "";
});

function restoreWallpaper() {
  const custom = localStorage.getItem("risaCustomWallpaper");

  if (custom) {
    phone.style.background =
      `url("${custom}") center / cover no-repeat`;
    return;
  }

  const saved = localStorage.getItem("risaWallpaper");

  if (saved) applyWallpaper(saved);
}

function closeWallpaperMenu() {
  wallpaperMenu.classList.add("hidden");
}

restoreWallpaper();


/* =====================================
   CAMERA
===================================== */

$("startCamera").addEventListener("click", async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API unavailable");
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    $("cameraVideo").srcObject = cameraStream;
    await $("cameraVideo").play();

  } catch (error) {
    alert("Camera access unavailable. Use HTTPS and allow camera permission.");
  }
});

$("takePhoto").addEventListener("click", () => {
  const video = $("cameraVideo");

  if (!video.videoWidth) {
    alert("Open the camera first.");
    return;
  }

  const canvas = $("cameraCanvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext("2d").drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const link = document.createElement("a");
  link.download = `risa-photo-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});


/* =====================================
   PHONE
===================================== */

$("dialPad").addEventListener("click", event => {
  if (event.target.tagName === "BUTTON") {
    $("dialDisplay").textContent += event.target.textContent;
  }
});

$("clearDial").addEventListener("click", () => {
  $("dialDisplay").textContent = "";
});

$("callDial").addEventListener("click", () => {
  const number = $("dialDisplay").textContent.trim();

  if (!number) {
    alert("Enter a phone number first.");
    return;
  }

  window.location.href = "tel:" + number;
});


/* =====================================
   MAPS AND SETTINGS
===================================== */

$("openMaps").addEventListener("click", () => {
  window.open("https://maps.google.com/", "_blank");
});

$("settingsLock").addEventListener("click", lockPhone);


/* =====================================
   IMESSAGE
===================================== */

(() => {
  const chat = document.querySelector("#pageMessages .imessage-chat");
  const input = $("messageInput");
  const sendButton = $("sendMessage");

  if (!chat || !input || !sendButton) return;

  const STORAGE_KEY = "risasPhone_LeaMessages";

  const originalMessages = [
    {
      text: "Good morning, Lei! Around the plaza pa ba kayo? May outreach pala ang parish youth, need nila ng help. Punta yung mga available dito sa may court.",
      type: "sent"
    },
    { text: "Salamat!", type: "sent" },
    { text: "Copy po, Chair", type: "received" },
    { text: "San ka po, madam?", type: "received" }
  ];

  let messages;

  try {
    messages = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!Array.isArray(messages)) {
      messages = originalMessages;
    }
  } catch {
    messages = originalMessages;
  }

  function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  function renderMessages() {
    chat.innerHTML = "";

    const dateLabel = document.createElement("div");
    dateLabel.className = "imessage-date";
    dateLabel.textContent = "iMessage";
    chat.appendChild(dateLabel);

    messages.forEach(message => {
      const row = document.createElement("div");
      row.className = `message-row ${message.type}`;

      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.textContent = message.text;

      row.appendChild(bubble);

      if (message.time) {
        const time = document.createElement("div");
        time.className = "message-time";
        time.textContent = message.time;
        row.appendChild(time);
      }

      chat.appendChild(row);
    });

    chat.scrollTop = chat.scrollHeight;
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

    messages.push({
      text,
      type: "sent",
      time
    });

    saveMessages();
    renderMessages();

    input.value = "";
    input.focus();
  }

  sendButton.addEventListener("click", sendMessage);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

  renderMessages();
})();


/* =====================================
   INITIAL SETUP
===================================== */

audio.volume = 0.7;

loadTrack(0, false);
renderPhotos();
initializeSpotify();
lockPhone();
