# context/

State global yang dibutuhin banyak halaman sekaligus.

- `AuthContext.jsx` - user yang login, `loading`, dan `login`, `register`,
  `logout`, `setUser`. Pake lewat `const { user } = useAuth();`.
  Token JWT disimpen di `localStorage` (`zenq_token`).
- `CartContext.jsx` - keranjang E-Commerce (`items`, `count`, `subtotal`,
  `add`, `change`, `clear`). Disimpen di `localStorage` (`zenq_cart`).
  Harga final tetap dihitung backend pas checkout (`POST /orders`).
