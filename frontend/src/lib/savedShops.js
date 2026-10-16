export const SAVED_KEY = "omm_savedShops";
export const SAVED_EVENT = "omm-saved-change";

export const getSavedIds = () => {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
};

export const toggleSavedId = (id) => {
  const current = getSavedIds();
  const isSaved = current.includes(id);
  const next = isSaved ? current.filter((x) => x !== id) : [id, ...current];
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch (err) {}
  window.dispatchEvent(new Event(SAVED_EVENT));
  return !isSaved;
};
