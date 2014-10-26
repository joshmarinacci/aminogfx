function lerp(a,b,t) {
    return a + t*(b-a);
}
process.on('message', function(m) {
    var row = [];
    for(var i=0; i<m.iw; i++) {
        var x0 = lerp(m.x0, m.x1, i/m.iw);
        //var x0 = m.x0+ (i/m.iw) * (m.x1-m.x0);
        var y0 = m.y;
        var x = 0.0;
        var y = 0.0;
        var iteration = 0;
        var max_iteration = m.iter;
        while(x*x + y*y < 2*2 && iteration < max_iteration) {
            xtemp = x*x - y*y + x0;
            y = 2*x*y + y0;
            x = xtemp;
            iteration = iteration + 1;
        }
        //return iteration;
        row[i] = iteration;
        //row.push(iteration);
        //console.log("iter = ", iteration);
        //process.send({iter:iteration, ix: m.ix, iy:m.iy});

    }
    process.send({row:row,iw:m.iw,iy:m.iy});
})
