// Temporary client-side gate for the GitHub Pages deployment. This is not a
// security boundary: the phrase and the destination are visible to visitors.
window.entryDestination = '/beyond/site.html';
window.entryAuthenticate = value => value.normalize('NFC').trim() === '欲穷千里目';
