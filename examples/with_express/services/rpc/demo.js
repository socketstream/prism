exports.actions = function(req, res, ss){

  return {

    squareNumber: function(number) {
      if (typeof number !== 'number') return res('Must be a number');
      res(null, number * number);
    }

  };
};