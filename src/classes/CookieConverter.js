export default class CookieConverter {
  static SAME_SITE_DICT = {
    no_restriction: 'None',
    lax: 'Lax',
    strict: 'Strict',
    unspecified: 'Unset',
  };

  static chromeCookieToObject(chromeCookie) {
    return {
      name: {
        key: 'name',
        value: chromeCookie.name,
        mutable: true,
        type: 'string',
      },
      value: {
        key: 'value',
        value: chromeCookie.value,
        mutable: true,
        type: 'string',
      },
      domain: {
        key: 'domain',
        value: chromeCookie.domain,
        mutable: true,
        type: 'string',
      },
      path: {
        key: 'path',
        value: chromeCookie.path,
        mutable: true,
        type: 'string',
      },
      expirationDate: {
        key: 'expirationDate',
        value: chromeCookie?.expirationDate,
        mutable: true,
        type: 'string',
      },
      session: {
        key: 'session',
        value: chromeCookie?.session,
        mutable: false,
        type: 'bool',
      },
      size: {
        key: 'size',
        value: new Blob([chromeCookie.value]).size, // differs from Chrome's native "size" col, have no idea how do they measure
        mutable: false,
        type: 'string',
      },
      httpOnly: {
        key: 'httpOnly',
        value: chromeCookie.httpOnly,
        mutable: true,
        type: 'bool',
      },
      secure: {
        key: 'secure',
        value: chromeCookie.secure,
        mutable: false,
        type: 'string',
      },
      sameSite: {
        key: 'sameSite',
        value: chromeCookie.sameSite,
        mutable: true,
        type: 'enum',
        enumValues: this.SAME_SITE_DICT,
      },
    };
  }

  static objectToChromeCookie(object) {
    const protocol = object.secure.value ? 'https' : 'http';
    const validDomain = object.domain.value.startsWith('.') ? object.domain.value.slice(1) : object.domain.value;

    const result = {
      name: object.name.value,
      value: object.value.value,
      domain: object.domain.value,
      path: object.path.value,
      httpOnly: object.httpOnly.value,
      secure: object.secure.value,
      sameSite: object.sameSite.value,
      url: `${protocol}://${validDomain}${object.path.value}`,
    };

    if (object.session.value) {
      result.session = true;
    } else {
      result.expirationDate = object.expirationDate.value;
    }

    return result;
  }
}
