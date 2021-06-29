function enter_res() {
    var score1 = document.getElementById('score1');
    var score2 = document.getElementById('score2');
    var max_score = document.getElementById('max_score');

    var myAnchor = document.getElementById("myAnchor");
    var i_score1 = document.createElement("input");
    i_score1.setAttribute("class", "form-control");
    i_score1.setAttribute("type", "number");

    i_score1.innerHTML = "replaced anchor!";
    score1.parentNode.replaceChild(i_score1, score1);

}