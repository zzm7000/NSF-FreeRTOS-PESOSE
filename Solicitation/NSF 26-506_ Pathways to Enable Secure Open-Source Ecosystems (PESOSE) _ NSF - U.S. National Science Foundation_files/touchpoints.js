/**
 * @file
 * JS for modifying the Touchpoints feedback form.
 * https://touchpoints.app.cloud.gov/
 */

(function touchpointsScript(Drupal, once) {
  'use strict';

  // The js that creates the initial Touchpoints feedback form is added through Google Tag Manager.
  // These functions modify that code. The form content and button text are updated through Touchpoints.
  // 'tpFeedback' refers to code related to the touchpoints feedback form. The 'touchpoints' keyword is
  // removed from attributes that are visible in the DOM so adblockers don't block the form.
  // @todo: Refactor everywhere we use ternary operators to check for the existence of the main container
  // by checking for main where all the functions are called at the end of the script.

  Drupal.behaviors.waitForTouchpointsButton = {
    attach: function (context) {
      // Ensure context is a valid DOM element
      if (!context || !context.nodeType) {
        context = document;
      }

      const root = document.documentElement;
      const buttonElement = document.getElementById('fba-button');

      // Exit early if the button doesn't exist
      if (!buttonElement) {
        return;
      }

      // Exit early if wrapper already exists (thanks to AJAX updates).
      if (document.querySelector('.fba-buttons-wrapper')) {
        return;
      }

      // Use once() to track elements already processed, or fall back to direct element if once is unavailable.
      let [touchpointsButton] = once
        ? once('tpfeedbackButton', buttonElement, context)
        : [buttonElement];

      function createButtonWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = 'fba-buttons-wrapper';
        return wrapper;
      }

      function createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.className = 'fba-close-button';
        closeButton.setAttribute('aria-label', 'Close feedback form');
        closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
          <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentcolor"/>
          </svg>`;

        return closeButton;
      }

      let mainSelector = 'main';

      let [main] =
        mainSelector && once
          ? once('tpFeedbackMain', mainSelector, context)
          : mainSelector
          ? [context.querySelector(mainSelector)]
          : [];
      let buttonWrapper = null;
      if (mainSelector) {
        main = document.querySelector(mainSelector);
      }

      // Determine container for appending button (fallback to footer/body for unified nav endpoints).
      const appendContainer =
        main || document.querySelector('footer') || document.body;

      function appendToMain() {
        const wrapper = createButtonWrapper();
        const closeButton = createCloseButton();
        wrapper.appendChild(touchpointsButton);
        wrapper.appendChild(closeButton);
        closeButton.addEventListener('click', () => {
          wrapper.style.display = 'none';
        });

        // Move the button in the source to better match visual order.
        // Use appendContainer which may be footer/body if main doesn't exist.
        if (touchpointsButton && appendContainer) {
          appendContainer.append(wrapper);
        }

        buttonWrapper = wrapper;
        return wrapper;
      }

      function setBuffer() {
        let mainDimensions = main?.getBoundingClientRect();
        let wrapperHeightHalf =
          buttonWrapper.getBoundingClientRect().height / 2;
        const rttWrapperElement = document.querySelector(
          '.usa-footer__return-to-top'
        );
        const [rttWrapper] = rttWrapperElement
          ? once('tpFeedbackRttWrapper', rttWrapperElement, context)
          : [null];
        const rttElement = document.querySelector(
          '.usa-footer__return-to-top--inner'
        );
        const [rtt] = rttElement
          ? once
            ? once('tpFeedbackRtt', rttElement, context)
            : [rttElement]
          : [null];
        let isRttEnabled = null;
        let rttTop;
        let touchpointsBtnBottomBuffer;

        if (rtt && rttWrapper) {
          rttTop = rtt.getBoundingClientRect().top;
          isRttEnabled = rttWrapper.classList.contains('enabled');
        }

        if (isRttEnabled) {
          // If Return to Top button is present, ensure touchpoints wrapper doesn't overlap.
          // Anchor to main or RTT depending on which is higher on the page at the time.
          touchpointsBtnBottomBuffer = main
            ? Math.min(mainDimensions.bottom, rttTop) - wrapperHeightHalf + 'px'
            : '70lvh';
        } else {
          // Otherwise, ensure touchpoints wrapper doesn't overlap footer.
          touchpointsBtnBottomBuffer = main
            ? mainDimensions.bottom - wrapperHeightHalf + 'px'
            : '70lvh';
        }

        let touchpointsBtnTopBuffer = main
          ? mainDimensions.top + wrapperHeightHalf + 'px'
          : '70lvh';

        // Set initial CSS variable values.
        root.style.setProperty(
          '--touchpointsBtnTopBuffer',
          touchpointsBtnTopBuffer
        );
        root.style.setProperty(
          '--touchpointsBtnBottomBuffer',
          touchpointsBtnBottomBuffer
        );

        document.addEventListener('scroll', () => {
          // Update values on scroll.
          mainDimensions = main?.getBoundingClientRect();
          touchpointsBtnTopBuffer = main
            ? mainDimensions.top + wrapperHeightHalf + 'px'
            : '70lvh';
          if (rtt) {
            rttTop = rtt.getBoundingClientRect().top;
            isRttEnabled =
              rttWrapper && rtt && rttWrapper.classList.contains('enabled');
          }

          if (isRttEnabled) {
            // If Return to Top button is present, ensure touchpoints wrapper doesn't overlap.
            // Anchor to main or RTT depending on which is higher on the page at the time.
            touchpointsBtnBottomBuffer = main
              ? Math.min(mainDimensions.bottom, rttTop) -
                wrapperHeightHalf +
                'px'
              : '70lvh';
          } else {
            // Otherwise, ensure touchpoints wrapper doesn't overlap footer.
            touchpointsBtnBottomBuffer = main
              ? mainDimensions.bottom - wrapperHeightHalf + 'px'
              : '70lvh';
          }

          // Set CSS variables based on current scroll values.
          root.style.setProperty(
            '--touchpointsBtnTopBuffer',
            touchpointsBtnTopBuffer
          );
          root.style.setProperty(
            '--touchpointsBtnBottomBuffer',
            touchpointsBtnBottomBuffer
          );
        });
      }

      function replaceSkipLink() {
        // Navigating to the feedback button using the skip link introduced accessibility issues, so we are removing it and replacing with a custom skiplink.
        // Remove the original skip link.
        let [originalTpSkipLink] = once
          ? once(
              'getOriginalTpSkipLink',
              document.querySelector('.touchpoints-skipnav'),
              context
            )
          : [document.querySelector('.touchpoints-skipnav')];
        originalTpSkipLink?.remove();

        // Create and insert new skip link.
        let [mainContentSkipLink] = once
          ? once(
              'getMainContentSkipLink',
              document.getElementById('js-skiplink-main-content'),
              context
            )
          : [document.getElementById('js-skiplink-main-content')];
        const newSkipLink = `<a href="#fba-button" class="visually-hidden focusable skip-link" id="tp-feedback-skip-link">Skip to feedback form</a>`;

        mainContentSkipLink
          ? mainContentSkipLink.insertAdjacentHTML('afterend', newSkipLink)
          : // Some legacy pages may not have a main content skip link. Attach the feedback form skip link
            // to the body instead.
            document.body.insertAdjacentHTML('afterbegin', newSkipLink);
      }

      function scrollToFeedback() {
        let touchpointsSkipLink = document.getElementById(
          'tp-feedback-skip-link'
        );
        touchpointsSkipLink?.addEventListener('click', () => {
          touchpointsButton?.classList.add('can-scroll-to');
          touchpointsButton?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
        touchpointsButton?.addEventListener('blur', () => {
          touchpointsButton.classList.remove('can-scroll-to');
        });
      }

      function a11yFixes() {
        // Get the hidden fba_directive text field without a label.
        // It's not clear the purpose of this field, but it's a hidden text field without a label.
        // Confirmed in NSF-11146 that this hidden input field is still present in the new Touchpoints form.
        const fbaDirectiveField = once
          ? once('tpFeedbackFBADirective', '#fba_directive', context)[0]
          : document.querySelector('#fba_directive');
        if (fbaDirectiveField) {
          // Create the label and hide like its input is hidden to make automated tests happy, even though the field is hidden.
          const fbaDirectiveLabel = document.createElement('label');
          fbaDirectiveLabel.setAttribute('for', 'fba_directive');
          fbaDirectiveLabel.setAttribute('aria-hidden', 'true');
          fbaDirectiveLabel.setAttribute('style', 'display: none !important');
          fbaDirectiveLabel.setAttribute('tabIndex', '-1');
          fbaDirectiveLabel.textContent = 'FBA Directive';

          // Insert into DOM.
          fbaDirectiveField.parentNode.insertBefore(
            fbaDirectiveLabel,
            fbaDirectiveField
          );
        }

        // Add a more complete label for screenreader users.
        touchpointsButton.setAttribute('aria-label', 'Provide feedback');
      }

      function fixModalHeading() {
        // Fix the modal heading hierarchy when it appears.
        let [touchpointsModal] = once
          ? once(
              'tpFeedbackModal',
              document.querySelector('.fba-modal-dialog'),
              context
            )
          : [document.querySelector('.fba-modal-dialog')];

        if (touchpointsModal) {
          // Set an aria-label on the modal.
          touchpointsModal.setAttribute('aria-label', 'NSF website feedback');

          // Convert modal h1 to h2 for proper heading hierarchy.
          const modalHeading = touchpointsModal.querySelector(
            'h1.fba-modal-title'
          );
          if (modalHeading) {
            const h2 = document.createElement('h2');

            // Copy attributes and content from h1 to h2.
            Array.from(modalHeading.attributes).forEach(function (attr) {
              h2.setAttribute(attr.name, attr.value);
            });

            // Move the heading content.
            while (modalHeading.firstChild) {
              h2.appendChild(modalHeading.firstChild);
            }

            // Replace h1 with h2.
            modalHeading.replaceWith(h2);
          }
        }
      }

      // Use a mutation observer to check for touchpoints elements.
      const touchpointsObserver = new MutationObserver(function (
        mutationsList,
        observer
      ) {
        // Check for the button.
        if (!touchpointsButton) {
          [touchpointsButton] = once
            ? once(
                'tpFeedbackButton',
                document.getElementById('fba-button'),
                context
              )
            : [document.getElementById('fba-button')];

          if (touchpointsButton) {
            appendToMain();
            setBuffer();
            replaceSkipLink();
            a11yFixes();
            scrollToFeedback();
          }
        }

        // Check for the modal.
        fixModalHeading();

        // If both are found, we can stop observing.
        if (touchpointsButton && document.querySelector('.fba-modal-dialog')) {
          observer.disconnect();
        }
      });

      // If button already exists, process it immediately.
      if (touchpointsButton) {
        appendToMain();
        setBuffer();
        replaceSkipLink();
        a11yFixes();
        scrollToFeedback();
      }

      // Start observing for modal (and button if it didn't exist yet).
      touchpointsObserver.observe(document, {
        childList: true,
        subtree: true,
      });

      // Stop observing after 10 seconds.
      setTimeout(() => {
        touchpointsObserver.disconnect();
      }, 10000);
    },
  };
  // When unified-nav is loaded by external apps (e.g., Ember), Drupal's 'once' library may not be available.
})(Drupal, typeof once !== 'undefined' ? once : null);
