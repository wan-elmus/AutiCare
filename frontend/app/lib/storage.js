export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  return true
}

export function load(key) {
  const value = localStorage.getItem(key)
  if (!value || value === 'undefined') return null
  return JSON.parse(value)
}

export function remove(key) {
  localStorage.removeItem(key)
}