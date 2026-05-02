// Simulasikan delay agar terasa seperti memanggil server sungguhan
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== ONBOARDING =====
export async function submitOnboarding(profileData) {
  console.log("Mocking Onboarding for:", profileData.nama);
  await sleep(1000);
  
  // Mengembalikan data sukses dummy
  return {
    status: 'success',
    message: 'Onboarding berhasil (Mock)',
    user_id: 'user-123'
  };
}

// ===== CHAT STREAMING =====
export async function sendMessageStream(payload, onChunk, onDone, onError) {
  try {
    console.log("Mocking Chat Stream for:", payload.message);
    await sleep(500);

    // Simulasi potongan teks (chunks) seperti respon AI asli
    const dummyResponses = [
      "Halo! ", "Ini ", "adalah ", "respon ", "otomatis ", 
      "dari ", "AksesIlmu ", "mode ", "dummy. ", 
      "\n\nSaya sedang membantu kamu belajar materi ini."
    ];

    for (const chunk of dummyResponses) {
      await sleep(100); // Simulasi kecepatan mengetik AI
      onChunk(chunk);
    }

    onDone();
  } catch (err) {
    onError("Gagal mengirim pesan (Mock Error)");
  }
}

// ===== UPLOAD SOURCE (RAG) =====
export async function uploadFile(file, userId) {
  console.log("Mocking Upload File:", file.name);
  await sleep(2000); // Simulasi proses ekstraksi PDF
  
  return {
    status: 'success',
    message: 'File berhasil diunggah dan di-index oleh RAG (Mock)',
    data: { id: Date.now().toString(), name: file.name, type: 'file' }
  };
}

export async function uploadURL(url, userId) {
  console.log("Mocking Upload URL:", url);
  await sleep(1500);
  return {
    status: 'success',
    data: { id: Date.now().toString(), name: url, type: 'url' }
  };
}

export async function uploadDrive(driveUrl, userId) {
  console.log("Mocking Upload Drive:", driveUrl);
  await sleep(1500);
  return {
    status: 'success',
    data: { id: Date.now().toString(), name: "Google Drive Doc", type: 'drive' }
  };
}

export async function uploadText(text, userId) {
  console.log("Mocking Upload Text");
  await sleep(1000);
  return {
    status: 'success',
    data: { id: Date.now().toString(), name: "Catatan Teks", type: 'text' }
  };
}

export async function getSources(userId) {
  await sleep(800);
  // Mengembalikan daftar sumber dummy agar UI "Spaces" kamu terisi
  return [
    { id: '1', name: 'Materi_Cloud_Computing.pdf', type: 'file' },
    { id: '2', name: 'https://reactjs.org/docs', type: 'url' }
  ];
}

export async function deleteSource(sourceId, userId) {
  console.log("Mocking Delete Source ID:", sourceId);
  await sleep(500);
  return { status: 'success', message: 'Source berhasil dihapus' };
}