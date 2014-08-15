console.log('testing');

var amino = require('amino');

var group1 = new amino.Group().id('group1');
var rect1  = new amino.Rect().id('rect1');
var rect2  = new amino.Rect().id('rect2');
var group2 = new amino.Group().id('group2');

group1.add(group2);
group2.add(rect2);
group1.add(rect1);
assertTrue(group1.find('rect').length() == 2, 'length of rect should be two');
assertTrue(group1.find('#rect1').length() == 1, 'id search should return one');


group1.remove(rect1);
assertTrue(group1.find('#rect1').length() == 0);
assertTrue(group1.find('#rect2').length() == 1);

group2.clear();
assertTrue(group1.find('rect').length() == 0);
dumpTree(group1, '  ');
assertTrue(group1.find('group').length() == 1, 'group length should be 1');



function dumpTree(root,tab) {
    console.log(tab+"node id=" + root.id());
    if(root.isParent && root.isParent()) {
        for(var i=0; i<root.children.length; i++) {
            dumpTree(root.children[i],tab+'  ');
        }
    }
}
function assertTrue(bool,msg) {

    if(!bool) {
        console.log('ERROR',msg);
//        throw new Error();
    } else {
        console.log("PASSED");
    }
}
