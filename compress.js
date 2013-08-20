var compressor = require('node-minify');

new compressor.minify({
    type: 'gcc',
    fileIn: 'public/js/smoothui.js',
    fileOut: 'public/js/smoothui.min.js',
    callback: function(err){
        console.log('GCC smoothui.min.js');
        if (err)
            console.log(err);
    }
});

new compressor.minify({
    type: 'no-compress',
    fileIn: ['public/js/jquery-2.0.3.min.js',
             'public/js/bootstrap.min.js',
             'public/js/paper-full.min.js',
             'public/js/hammer.min.js'],
    fileOut: 'public/js/smoothui-deps.min.js',
    callback: function(err){
        console.log('Concat smoothui-deps.min.js');
        if (err)
            console.log(err);
    }
});

new compressor.minify({
    type: 'yui-css',
    fileIn: ['public/css/bootstrap.min.css',
             'public/css/font-awesome.css',
             'public/css/google-fonts-ubuntu.css',
             'public/css/google-fonts-opensans.css',
             'public/css/index.css'],
    fileOut: 'public/css/index-combined.min.css',
    callback: function(err){
        console.log('YUI-CSS index-combined.min.css');
        if (err)
            console.log(err);
    }
});

new compressor.minify({
    type: 'gcc',
    fileIn: ['public/js/jquery-2.0.3.min.js',
             'public/js/bootstrap.min.js',
             'public/js/button.js'],
    fileOut: 'public/js/index-combined.min.js',
    callback: function(err){
        console.log('GCC index-combined.min.js');
        if (err)
            console.log(err);
    }
});
