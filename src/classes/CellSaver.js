import moment from 'moment/moment';
import CookieConverter from './CookieConverter';

export default class CellSaver {
  static async saveCellValue(cellKey, target, currentCookie, store) {
    if (!currentCookie[cellKey]?.mutable) {
      return;
    }

    let { value } = target;

    if (cellKey === 'expirationDate') {
      value = moment(value, 'YYYY-MM-DD HH:mm:ss').unix();
    }

    if (currentCookie[cellKey].type === 'bool') {
      value = target.checked;
    }

    if (target.type === 'textarea') {
      try {
        const decodedJson = JSON.parse(value);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (decodedJson && typeof decodedJson === 'object') {
          value = JSON.stringify(decodedJson);
        }
      } catch (e) {
        // nothing to do
      }

      value = encodeURIComponent(value);
    }

    const newCookieObject = { ...currentCookie };
    newCookieObject[cellKey].value = value;
    const newCookie = CookieConverter.objectToChromeCookie(newCookieObject);

    const newCookieWithoutSession = { ...newCookie }; // Chrome API doesn't accept session field
    delete newCookieWithoutSession.session;

    await chrome.cookies.set(newCookieWithoutSession);
    await store.dispatch('updateCookie', { newCookie });
  }
}
