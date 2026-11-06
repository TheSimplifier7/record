#!/usr/bin/env node
"use strict";
const { tagFrom, rewrite } = require("./refcarry.js");
const page = "https://thesimplifier7.com/method.html";
const fan = "https://buy.stripe.com/4gMbJ3gw91552dx4cm5kk00";
const method = "https://buy.stripe.com/9B628tfs5299cSb24e5kk01";
const fails = [];
const check = (cond, msg) => { if (!cond) fails.push(msg); };

check(tagFrom("") === "site", "no tag defaults to site");
check(tagFrom("?ref=test-grok") === "test-grok", "test-grok is kept");
check(tagFrom("?utm_source=x-bio") === "x-bio", "utm_source is kept");
check(tagFrom("?ref=has space") === "site", "a tag with a space is refused");
check(tagFrom("?ref=someone@email.com") === "site", "an email is refused as a tag");

const bare = rewrite(fan, page, "site");
check(bare.includes("client_reference_id=site"), "untagged checkout is marked site");
check(bare.includes("utm_source=site"), "untagged checkout sets utm_source");
check(!bare.includes("@"), "no email reaches Stripe");

const tagged = rewrite(method, page + "?ref=test-grok", "test-grok");
check(tagged.includes("client_reference_id=test-grok"), "test-grok reaches Stripe");
check(tagged.startsWith(method), "the Method link is unchanged apart from the query");

const internal = rewrite("levels.html", page + "?ref=x-pin", "x-pin");
check(internal === "/levels.html?ref=x-pin", "a real tag is carried to the next page");
check(rewrite("levels.html#week", page, "site") === null, "the site default is not written onto ordinary links");
check(rewrite("https://billing.stripe.com/p/login/4gMbJ3gw91552dx4cm5kk00", page, "x-pin") === null, "the billing portal is not retagged");
check(rewrite("mailto:hello@thesimplifier7.com", page, "x-pin") === null, "mail links are left alone");

if (fails.length) {
  console.error(fails.join("\n"));
  process.exit(1);
}
console.log("refcarry: tagged and untagged checkouts carry the intended client_reference_id.");
