Vue.use(VueFormWizard)
new Vue({
  el: '#task_app',
  methods: {
      onComplete: function(){
        $("#submitButton").click();
      }
  },
  mounted(){
    var wizard = this.$refs.wizard
    wizard.activateAll()
   }
})

var button_text = "Next"
$(document).ready(function () {
    $('#submitButton').click(function () {
        try {
            $('input[name=te]').attr('value', TimeMe.getTimeOnCurrentPageInSeconds());
            // console.log(TimeMe.getTimeOnCurrentPageInSeconds())
        } catch {

        }
        // NOTE: Can add validation here if desired.
        return true;
    });

    $( ".wizard-header" ).remove();

    $(".wizard-progress-with-circle").css({top: '50px'});

    $(".wizard-tab-content").css("padding-top", '15px');

    $("li a").click(function() {
        // $("html, body").animate({ scrollTop: 0 });
        // return false;
        window.scrollTo(0, 0)
    });

    $(".wizard-footer-right").on('mousedown', function() {
        button_text = $(".wizard-footer-right .wizard-btn").text()
        button_text = button_text.replace(/\s/g, "");
    });

    $(".wizard-footer-right").on('click', function() {
        // $("html, body").animate({ scrollTop: 0 });
        // return false;
        window.scrollTo(0, 0)
        // var button_text = $(".wizard-footer-right .wizard-btn").text()
        // button_text = button_text.replace(/\s/g, "");
        // console.log(button_text)
        // if (button_text == "Finish") {
        //     $("#submitButton").click();
        // }
    });

    $(".wizard-footer-left").click(function() {
        // $("html, body").animate({ scrollTop: 0 });
        // return false;
        window.scrollTo(0, 0)
    });

    $(window).scroll(function() { 
        $('.wizard-nav').css('top', $(this).scrollTop() - 5);
        $('.wizard-progress-with-circle').css('top', $(this).scrollTop() + 45);
    });
    
});