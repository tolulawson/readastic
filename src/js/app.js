const $ = require('jquery');
const humanizeDuration = require('humanize-duration');

global.$ = $;

//
$(() => {
  const model = {
    init() {
      this.wordCount = 0;
      this.WPM = 250;
      this.textContent = '';
    },

    setScriptLength(length) {
      model.scriptLength = Number(length);
    },

    setWPM(wpm) {
      model.WPM = Number(wpm);
    },
  };

  const textAreaView = {
    init() {
      this.textContent = '';
      this.wordCount = 0;

      function onPaste() {
        function getTextContent() {
          return $('#text-area').val();
        }

        function getWordCountFromScript(script) {
          const regex = /\b(\w+)\b/g;
          return script.match(regex).length;
        }

        setTimeout(() => {
          textAreaView.textContent = getTextContent();

          textAreaView.wordCount = getWordCountFromScript(textAreaView.textContent);
          controller.textAreaChanged();
        }, 0);
      }

      function onKeyup() {
        setTimeout(() => {
          const textContent = $('#text-area').val();
          if (!Number.isNaN(Number(textContent))) {
            textAreaView.wordCount = Number(textContent);
            textAreaView.textContent = '';
            controller.textAreaChanged();
          } else {
            onPaste();
          }
        }, 0);
      }

      $('#text-area').on('paste', onPaste);

      $('#text-area').on('keyup', onKeyup);
    },
  };

  const wpmRangeView = {
    init() {
      this.wpm = 250;

      function getWPM() {
        wpmRangeView.wpm = $(this).val();
        controller.wpmUpdated(wpmRangeView.wpm);
      }

      $('#wpm-selector').on('input', getWPM);
    },

  };

  const wpmValueView = {
    render() {
      $('#wpm-value').text(wpmRangeView.wpm);
    },
  };

  const readTimeView = {
    render(readTime) {
      $('#time-result').text(readTime);
      $('.read-time').removeClass('hidden');
    },
  };

  const wordCountView = {
    init() {
      controller.renderWordCount();
    },

    render(wordCount) {
      $('.input-text-error').addClass('hidden');
      $('#word-count').text(wordCount);
      $('.word-count').removeClass('hidden');

      if (wordCount === 1) {
        $('.count-plural').text('');
      } else {
        $('.count-plural').text('s');
      }
    },
  };

  const errorMessageView = {
    render() {
      $('.input-text-error').removeClass('hidden');
      $('.word-count').addClass('hidden');
    },
  };

  const playButtonView = {
    init() {
      this.playing = false;
      this.playButton = $('#play-button');
      playButtonView.render();
    },

    render(contentAvailable = false) {
      if (contentAvailable) {
        this.playButton.removeAttr('disabled');
      } else {
        this.playButton.attr('disabled', true);
      }
      if (this.playing) {
        this.playButton.addClass('playing');
      }
    },
  };

  const controller = {
    init() {
      model.init();
      textAreaView.init();
      wpmRangeView.init();
      wordCountView.init();
      playButtonView.init();
    },

    renderWPMValue() {
      wpmValueView.render();
    },

    storeWPMValue(wpm) {
      model.setWPM(wpm);
    },

    storeWordCount(wordCount) {
      model.wordCount = wordCount;
    },

    storeTextContent(textContent) {
      model.textContent = textContent;
    },

    getReadTime() {
      const readTime = (model.wordCount / model.WPM) * 60000;
      return humanizeDuration(readTime, { round: true });
    },

    renderReadTime() {
      readTimeView.render(controller.getReadTime());
    },

    renderWordCount() {
      wordCountView.render(model.wordCount);
    },

    renderErrorMessage() {
      errorMessageView.render();
    },

    textAreaChanged() {
      controller.storeWordCount(textAreaView.wordCount);
      controller.storeTextContent(textAreaView.textContent);
      controller.renderReadTime();
      controller.renderWordCount();
      controller.contentAvailable();
    },

    contentAvailable() {
      if (model.textContent.length > 0) {
        playButtonView.render(true);
      } else {
        playButtonView.render(false);
      }
    },

    wpmUpdated(wpm) {
      controller.renderWPMValue();
      controller.storeWPMValue(wpm);
      controller.renderReadTime();
    },
  };

  controller.init();
});
