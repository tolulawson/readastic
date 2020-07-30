const popper = require('@popperjs/core');

const $ = require('jquery');
const humanizeDuration = require('humanize-duration');
const xmlbuilder = require('xmlbuilder');
require('datejs');
require('jquery-contextmenu');

global.$ = $;

//
$(() => {
  const model = {
    init() {
      this.wordCount = 0;
      this.WPM = 150;
      this.textContent = '';
      this.playStatus = 0;
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
          if (script.match(regex)) {
            return script.match(regex).length;
          }
          return 0;
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
      this.wpmSelector = $('#wpm-selector');
      this.step = 1;
      this.min = 80;
      this.max = 250;
      this.starterWPM = 0;

      function onWPMRangeSlide() {
        function calcAudioPlayRate() {
          return controller.getWPMValue() / wpmRangeView.starterWPM;
        }
        controller.wpmUpdated($(this).val());
        playWidgetView.audio[0].playbackRate = calcAudioPlayRate();
      }

      $('#wpm-selector').on('input', onWPMRangeSlide);
      wpmRangeView.render();
    },

    render() {
      wpmRangeView.wpmSelector.attr({
        min: this.min,
        max: this.max,
        step: this.step,
      });
      wpmRangeView.wpmSelector.val(controller.getWPMValue());
    }

  };

  const wpmValueView = {
    init() {
      this.render();
    },

    render() {
      $('#wpm-value').text(controller.getWPMValue());
    },
  };

  const readTimeView = {
    render(readTime) {
      $('#time-result').text(readTime);
      if (controller.getTextContent().length > 0) {
        $('.read-time').removeClass('hidden');
      } else {
        $('.read-time').addClass('hidden');
      }
    },
  };

  const wordCountView = {
    init() {
      // controller.renderWordCount();
    },

    render(wordCount) {
      $('.input-text-error').addClass('hidden');
      $('#word-count').text(wordCount);
      $('.word-count').removeClass('hidden');

      if (controller.getTextContent().length < 1) {
        $('.word-count').addClass('hidden');
      }

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

      function onClick() {
        controller.playAudio();
      }

      this.playButton.click(onClick);
    },

    render(contentAvailable = false) {
      if (contentAvailable) {
        this.playButton.removeAttr('disabled');
      } else {
        this.playButton.attr('disabled', true);
      }
      if (controller.getPlayStatus() === 2) {
        this.playButton.addClass('playing');
      } else if (controller.getPlayStatus() === 1) {
        this.playButton.attr('disabled', true);
      } else if (controller.getPlayStatus() === 3) {
        this.playButton.removeClass('playing');
      } else if (controller.getPlayStatus() === 0) {
        this.playButton.removeClass('playing');
      }
    },
  };

  const playMessageView = {
    init() {
      this.playMessage = $('.play-message');
      playMessageView.render(controller.getPlayStatus());
    },

    render(status) {
      if (status !== 0) {
        this.playMessage.addClass('hidden');
      } else {
        this.playMessage.removeClass('hidden');
      }
    },
  };

  const playWidgetView = {
    init() {
      this.playWidget = $('.play-widget');
      this.loadIndicator = $('.lds-ellipsis');
      this.player = $('.play-indicator');
      this.progressBar = $('#progress-bar');
      this.menu = $('.audio-menu');
      this.statuses = {
        none: 0,
        loading: 1,
        playing: 2,
        paused: 3,
      };
      this.audio = $('#audio');
      this.elapsedTime = $('#elapsed');
      this.totalTime = $('#total');

      function getAudioWPM() {
        return Math.round(model.wordCount / (playWidgetView.audio[0].duration / 60));
      }

      function formattedTime(seconds) {
        return (new Date()).clearTime()
          .addSeconds(Math.round(seconds))
          .toString('mm:ss');
      }

      this.progressBar.on('input', function seekAudio() {
        playWidgetView.audio[0].currentTime = $(this).val();
      });

      this.audio.on({
        play: () => {
          controller.updatePlayStatus(2);
        },
        pause: () => {
          // controller.updatePlayStatus(3);
        },
        ended: () => {
          controller.updatePlayStatus(3);
          playWidgetView.audio[0].currentTime = 0;
        },
        timeupdate: function updateProgressBar() {
          playWidgetView.progressBar.val(this.currentTime);

          playWidgetView.elapsedTime.text(formattedTime(this.currentTime / this.playbackRate));
          playWidgetView.totalTime.text(formattedTime(this.duration / this.playbackRate));
        },
        loadedmetadata: function setProgressBarMax() {
          playWidgetView.progressBar.attr('max', this.duration);
          wpmRangeView.starterWPM = getAudioWPM();
          controller.wpmUpdated(getAudioWPM());
          playWidgetView.elapsedTime.text(formattedTime(this.currentTime / this.playbackRate));
          playWidgetView.totalTime.text(formattedTime(this.duration / this.playbackRate));
        },
      });

      playWidgetView.render(controller.getPlayStatus());
    },

    render(status) {
      if (status === this.statuses.none) {
        this.audio.src = '';
        this.audio[0].pause();
        this.playWidget.addClass('hidden');
        this.loadIndicator.addClass('hidden');
        this.player.addClass('hidden');
        this.menu.addClass('hidden');
      } else if (status === this.statuses.loading) {
        this.playWidget.removeClass('hidden');
        this.loadIndicator.removeClass('hidden');
      } else if (status === this.statuses.playing) {
        this.playWidget.removeClass('hidden');
        this.loadIndicator.addClass('hidden');
        this.player.removeClass('hidden');
        this.menu.removeClass('hidden');
      }
    },

  };

  const menuView = {
    init() {
      this.downloadLink = $('#download-button');

      const info = $('#pop')[0];
      const tooltip = $('#pop-up')[0];

      const pop = popper.createPopper(info, tooltip, {
        placement: 'top',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ],
      });

      $('#pop-up-check').change(function onCheck() {
        if (this.checked) {
          $('#pop-up').attr('data-show', '');
        } else {
          $('#pop-up').removeAttr('data-show');
        }
        pop.update();
      });
    },

    render(downloadLink, voiceList) {

      console.log(voiceList);

      const menuObject = {
        selector: '#option-button',
        trigger: 'left',
        hideOnSecondTrigger: true,
        items: {
          clear: {
            name: 'Clear audio',
            icon: '',
            callback() {
              controller.updatePlayStatus(0);
            },
          },
          download: {
            name: `<a href="${downloadLink}" id="download-button" download="script-audio.mp3">
              Download
            </a>`,
            isHtmlName: true,
            icon: 'download',
          },
          voices: {
            name: 'Change voice',
            items: {
            },
          },
        },
      };

      voiceList.forEach((voice) => {
        menuObject.items.voices.items[voice.displayName] = {
          name: `<span data-voiceName="${voice.name}" class="voice ${voice.displayName === 'Mia' ? 'selected' : ''}"><strong>${voice.displayName}</strong> (${voice.locale}, ${voice.gender})`,
          isHtmlName: true,
        };
      });

      $.contextMenu(menuObject);

      $('.voice').click(function changeVoice() {
        controller.updatePlayStatus(0);
        controller.playAudio($(this).attr('data-voiceName'));
        $('.voice').removeClass('selected');
        $(this).addClass('selected');
        $('#option-button').contextMenu('hide');
      });
    },
  };

  const controller = {
    init() {
      model.init();
      textAreaView.init();
      wpmRangeView.init();
      wordCountView.init();
      playButtonView.init();
      playMessageView.init();
      playWidgetView.init();
      wpmValueView.init();
      menuView.init();
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

      if (controller.getPlayStatus() < 2) {
        controller.renderPlayButton();
      }
      // controller.updatePlayStatus(0);
    },

    renderPlayButton() {
      if (this.getTextContent().length > 0) {
        playButtonView.render(true);
      } else {
        playButtonView.render(false);
      }
    },

    getWPMValue() {
      return model.WPM;
    },

    wpmUpdated(wpm) {
      controller.storeWPMValue(wpm);
      controller.renderWPMValue();
      if (this.getTextContent().length > 0) {
        controller.renderReadTime();
      }
      wpmRangeView.render();
    },

    getTextContent() {
      return model.textContent;
    },

    renderPlayWidget() {
      playWidgetView.render(controller.getPlayStatus());
    },

    getPlayStatus() {
      return model.playStatus;
    },

    updatePlayStatus(status) {
      model.playStatus = status;
      playWidgetView.render(status);
      playMessageView.render(status);
      controller.renderPlayButton();
    },

    fetchAudio(voice = 'Microsoft Server Speech Text to Speech Voice (en-GB, MiaNeural)', text = this.getTextContent()) {
      return new Promise((resolve) => {
        $.ajax({
          url: 'https://westus2.api.cognitive.microsoft.com/sts/v1.0/issuetoken',
          method: 'POST',
          headers: {
            'Content-type': 'application/x-www-form-urlencoded',
            'Ocp-Apim-Subscription-Key': 'a89fff92801d4020930577013ee47618',
          },
          success: (token) => {
            $.ajax({
              url: 'https://westus2.tts.speech.microsoft.com/cognitiveservices/voices/list',
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-type': 'application/ssml+xml',
              },
              success: (list) => {
                const voiceList = list.filter((item) => item.Locale.startsWith('en') && item.VoiceType === 'Neural').map((item) => ({
                  name: item.Name,
                  displayName: item.DisplayName,
                  shortName: item.ShortName,
                  gender: item.Gender,
                  locale: item.Locale,
                }));

                const xmlBody = xmlbuilder.create('speak')
                  .att('version', '1.0')
                  .att('xml:lang', 'en-us')
                  .ele('voice')
                  .att('xml:lang', 'en-us')
                  .att('name', voice)
                  .txt(text)
                  .end();

                const bod = xmlBody.toString();

                fetch('https://westus2.tts.speech.microsoft.com/cognitiveservices/v1', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'cache-control': 'no-cache',
                    'User-Agent': 'tts',
                    'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3',
                    'Content-Type': 'application/ssml+xml',
                  },
                  body: bod,
                })
                  .then((response) => response.arrayBuffer())
                  .then((data) => {
                    const blob = new Blob([data], { type: 'audio/mpeg' });
                    const link = window.URL.createObjectURL(blob);
                    resolve({ link, voiceList });
                  })
                  .catch((err) => {
                    alert(err);
                  });
              },
            });
          },
        });
      });
    },

    playAudio(voice) {
      if (model.playStatus === 0) {
        $('#audio')[0].pause();
        controller.updatePlayStatus(1);
        controller.renderPlayWidget();
        controller.renderPlayButton();
        controller.fetchAudio(voice)
          .then((result) => {
            $('#audio-source').attr('src', result.link);

            menuView.render(result.link, result.voiceList);
            $('#audio')[0].load();
            $('#audio')[0].play()
              .then(() => {
                controller.updatePlayStatus(2);
                controller.renderPlayButton();
                controller.renderPlayWidget();
              });
          });
      } else if (model.playStatus === 2) {
        $('#audio')[0].pause();
        controller.updatePlayStatus(3);
        controller.renderPlayButton();
        controller.renderPlayWidget();
      } else if (model.playStatus === 3) {
        $('#audio')[0].play()
          .then(() => {
            controller.updatePlayStatus(2);
            controller.renderPlayButton();
            controller.renderPlayWidget();
          });
      }
    },
  };

  controller.init();
});
