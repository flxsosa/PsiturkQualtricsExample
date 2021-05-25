/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
    "instructions/instruct-ready.html",
    "stage.html",
    "postquestionnaire.html"
];

// The qualtrics surveys, indexed by the condition
// Populate this with your list of URLs. I'm assuming you have
// one Qualtrics survey per condition. If you only have one
// condition, that works with this too
var surveys = [
    "url_1",
    "url_2"
]

// In javascript, defining a function as `async` makes it return  a `Promise`
// that will "resolve" when the function completes. Below, `init` is assigned to be the
// *returned value* of immediately executing an anonymous async function.
// This is done by wrapping the async function in parentheses, and following the
// parentheses-wrapped function with `()`.
// Therefore, the code within the arrow function (the code within the curly brackets) immediately
// begins to execute when `init is defined. In the example, the `init` function only
// calls `psiTurk.preloadPages()` -- which, as of psiTurk 3, itself returns a Promise.
//
// The anonymous function is defined using javascript "arrow function" syntax.
const init = (async () => {
    await psiTurk.preloadPages(pages);
})()

var instructionPages = [ // add as a list as many pages as you like
    "instructions/instruct-ready.html"
];


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

/********************
* EXPERIMENT       *
********************/
var Experiment = function() {

    var finish = function() {
        currentview = new Questionnaire();
    };

    // Load the stage.html snippet into the body of the page
    psiTurk.showPage('stage.html');
    $('#finish').hide();
    $('#finish').click(finish);

    // Start the test
    // load your iframe with a url specific to your participant
    // This is where the Qualtrics survey will be shown
    $('#iframe').attr('src',surveys[mycondition]);
    // $('#iframe').attr('src','https://rutgers.ca1.qualtrics.com/jfe/form/SV_5cHY8uKbTgnOJ0O');
    $('#iframe').attr('frameborder', 0);
    // $('#iframe').attr('src','http://felixsosa.com&UID=' + uniqueId);

    // This is the event listener for the Qualtrics survey. It will listen for the survey to
    // send an "End of Survey" message to Psiturk. At which point, you can use this function to
    // respond to that message (e.g. enabling a button to move onto the next page)
    window.addEventListener('message', function(event){
        console.log(event.data)
        // normally there would be a security check here on event.origin (see the MDN link above), but meh.
        if (event.data) {
            if (typeof event.data === 'string') {
                q_message_array = event.data.split('|');
                if (q_message_array[0] == 'QualtricsEOS') {
                    console.log(q_message_array)
                    psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'back_from_qualtrics'});
                    psiTurk.recordUnstructuredData('qualtrics_session_id', q_message_array[2]);
                    $('#finish').show();
                }
            }
        }
    })
};


/****************
* Questionnaire *
****************/

var Questionnaire = function() {

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    prompt_resubmit = function() {
        document.body.innerHTML = error_message;
        $("#resubmit").click(resubmit);
    };

    // Load the questionnaire snippet
    psiTurk.showPage('postquestionnaire.html');

    psiTurk.saveData({
        success: function(){
            psiTurk.completeHIT();
        },
        error: prompt_resubmit});
};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
 // In this example `task.js file, an anonymous async function is bound to `window.on('load')`.
 // The async function `await`s `init` before continuing with calling `psiturk.doInstructions()`.
 // This means that in `init`, you can `await` other Promise-returning code to resolve,
 // if you want it to resolve before your experiment calls `psiturk.doInstructions()`.

 // The reason that `await psiTurk.preloadPages()` is not put directly into the
 // function bound to `window.on('load')` is that this would mean that the pages
 // would not begin to preload until the window had finished loading -- an unnecessary delay.
$(window).on('load', async () => {
    await init;
    psiTurk.doInstructions(
        instructionPages, // a list of pages you want to display in sequence
        function() { currentview = new Experiment(); } // what you want to do when you are done with instructions
    );
});
