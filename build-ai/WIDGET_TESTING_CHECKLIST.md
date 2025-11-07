# 🧪 Build.AI Widget Testing Checklist

## Visual & UI Tests

- [ ] Widget bubble appears in correct position
- [ ] Widget opens/closes smoothly with animation
- [ ] Colors match the configuration
- [ ] Text is readable on all backgrounds
- [ ] Icons load correctly
- [ ] Chat window is properly sized
- [ ] Watermark displays correctly (if enabled)
- [ ] Responsive on mobile devices
- [ ] Works on tablet sizes
- [ ] No layout shifts when loading

## Functionality Tests

- [ ] Widget loads without errors
- [ ] Can send messages successfully
- [ ] Receives responses from chatbot
- [ ] Markdown formatting displays correctly (**bold**, _italic_, lists)
- [ ] Links are clickable and open correctly
- [ ] Code blocks are formatted properly
- [ ] Long messages scroll correctly
- [ ] Typing indicator appears
- [ ] Message timestamps show correctly
- [ ] Session persists on page refresh
- [ ] Can minimize/maximize widget

## Performance Tests

- [ ] Widget loads in < 3 seconds
- [ ] No console errors
- [ ] No memory leaks (check DevTools)
- [ ] Responses arrive in < 5 seconds
- [ ] Widget doesn't block page interactions
- [ ] Smooth scrolling in chat
- [ ] No lag when typing

## Cross-Browser Tests

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## CORS & Network Tests

- [ ] Widget works on external domains
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors in console
- [ ] Works over HTTPS
- [ ] Works on HTTP (if applicable)

## Edge Cases

- [ ] Very long messages (1000+ chars)
- [ ] Special characters in messages
- [ ] Multiple rapid messages
- [ ] Network offline/online
- [ ] Widget on very small screens (320px)
- [ ] Widget on very large screens (4K)
- [ ] Multiple widgets on same page (if supported)

## Content Tests

- [ ] Chatbot responds with correct knowledge base info
- [ ] Sources are cited correctly
- [ ] Error messages are user-friendly
- [ ] Welcome message appears
- [ ] Empty state displays correctly

## Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG standards
- [ ] Can close widget with Escape key

## Security Tests

- [ ] No XSS vulnerabilities
- [ ] API calls use HTTPS
- [ ] Session tokens handled securely
- [ ] No sensitive data in console logs
- [ ] CORS properly configured

---

## Test Results

**Date Tested:** ******\_\_\_******
**Tester:** ******\_\_\_******
**Browser:** ******\_\_\_******
**Device:** ******\_\_\_******

**Issues Found:**

1.
2.
3.

**Overall Rating:** ⭐⭐⭐⭐⭐
