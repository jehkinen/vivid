import { createLinkMatcherWithRegExp } from '@lexical/link'

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/

export const AUTO_LINK_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) =>
    text.startsWith('http') ? text : `https://${text}`
  ),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`),
]
