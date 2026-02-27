# Miscellaneous Fragments

This is a group of miscellaneous fragments which can be useful in certain circumstances.

These fragments may not be suitable for a production scenario, and are simply intended to be example of what is possible.

## Customer Registration

This fragment contains JavaScript which targets the Liferay menu bar and Login Card fragment.

In terms of the Liferay menu bar, it is used to hide a link on the menu bar when the user is logged in. For example, you could use it to hide a Register link once the user has logged in.

In terms of the Login Card fragment, it overrides the link of the Create Account link (if present) so that it can be pointed to a custom page. This is useful if you want to introduce a custom registration / on-boarding process, i.e., avoid using the OOB create user account process.

## Modify My Profile Link

There are times when you want to override the target of menu items in the User Personal Menu. For example, you may want to override the My Profile Link to target a different page to the default.

This JavaScript based fragment allows you to do just that.

## My Dashboard Link

This fragment in another JavaScript which rather than hides a Liferay menu bar item, it changes the target of it. For example, if you want a public and private link to both point to a private page without 'hardcoding' the absolute URL, then this fragment can update the link using a relative location.
