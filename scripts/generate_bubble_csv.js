const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('bookleaf_sample_data.json', 'utf8'));

if (!fs.existsSync('bubble_data')) {
  fs.mkdirSync('bubble_data');
}

// 1. Authors / Users CSV
// Built-in User in Bubble has 'email'. We define custom fields: name (text), author_id (text), role (text), phone (text), city (text), joined_date (date)
const authorHeaders = ['email', 'name', 'author_id', 'role', 'phone', 'city', 'joined_date'];
const authorRows = [authorHeaders.join(',')];

// Admin account
authorRows.push(['admin@bookleafpub.com', '"Operations Admin"', 'ADMIN001', 'Admin', '"+91-99999-00000"', '"Delhi"', '2021-01-01'].join(','));

data.authors.forEach(a => {
  authorRows.push([
    a.email,
    `"${a.name}"`,
    a.author_id,
    'Author',
    `"${a.phone}"`,
    `"${a.city}"`,
    a.joined_date
  ].join(','));
});

fs.writeFileSync('bubble_data/authors.csv', authorRows.join('\n'), 'utf8');
console.log('Created bubble_data/authors.csv with', authorRows.length - 1, 'records');

// 2. Books CSV
const bookHeaders = [
  'book_id',
  'title',
  'author_id',
  'author_email',
  'author_name',
  'isbn',
  'genre',
  'publication_date',
  'status',
  'mrp',
  'author_royalty_per_copy',
  'total_copies_sold',
  'total_royalty_earned',
  'royalty_paid',
  'royalty_pending',
  'last_royalty_payout_date',
  'print_partner',
  'available_on'
];

const bookRows = [bookHeaders.join(',')];

data.authors.forEach(a => {
  a.books.forEach(b => {
    bookRows.push([
      b.book_id,
      `"${b.title.replace(/"/g, '""')}"`,
      a.author_id,
      a.email,
      `"${a.name}"`,
      `"${b.isbn || ''}"`,
      `"${b.genre}"`,
      b.publication_date || '',
      `"${b.status}"`,
      b.mrp || 0,
      b.author_royalty_per_copy || 0,
      b.total_copies_sold || 0,
      b.total_royalty_earned || 0,
      b.royalty_paid || 0,
      b.royalty_pending || 0,
      b.last_royalty_payout_date || '',
      `"${b.print_partner || ''}"`,
      `"${b.available_on ? b.available_on.join(', ') : ''}"`
    ].join(','));
  });
});

fs.writeFileSync('bubble_data/books.csv', bookRows.join('\n'), 'utf8');
console.log('Created bubble_data/books.csv with', bookRows.length - 1, 'records');
