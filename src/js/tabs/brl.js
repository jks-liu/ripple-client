var util = require('util'),
    Tab = require('../client/tab').Tab;

var BrlTab = function ()
{
  Tab.call(this);
};

util.inherits(BrlTab, Tab);

BrlTab.prototype.tabName = 'brl';
BrlTab.prototype.mainMenu = 'fund';

BrlTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['qr']);

BrlTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/brl.jade')();
};

BrlTab.prototype.angular = function (module)
{
  module.controller('BrlCtrl', ['$scope', 'rpId', 'rpAppManager', 'rpTracker', '$routeParams', 'rpKeychain', 'rpNetwork', '$timeout',
    function ($scope, $id, appManager, rpTracker, $routeParams, keychain, $network, $timeout)  {

      $scope.$watch('lines', function () {
        if($scope.lines['rfNZPxoZ5Uaamdp339U9dCLWz2T73nZJZHBRL']){
          $scope.brlConnected = true;
        }
        else {
          $scope.brlConnected = false;
        }
      }, true);



      $scope.toggleInstructions = function() {
         $scope.showInstructions = !$scope.showInstructions;
      }

      $scope.create_trust_line = function () {

        $scope.loading = true;

        $scope.load_notification('loading');

        var amount = ripple.Amount.from_human(
            Options.gateway_max_limit + ' ' + 'BRL',
            {reference_date: new Date(+new Date() + 5*60000)}
        );

        amount.set_issuer("rfNZPxoZ5Uaamdp339U9dCLWz2T73nZJZH");

        if (!amount.is_valid()) {
          // Invalid amount. Indicates a bug in one of the validators.
          console.log('Invalid amount');
          return;
        }

        var tx = $network.remote.transaction();

        // Add memo to tx
        tx.addMemo('client', 'rt' + $scope.version);

        // Flags
        tx
            .rippleLineSet($id.account, amount)
            .on('success', function (res) {
              $scope.$apply(function () {
                setEngineStatus(res, true);

                $scope.loading = false
                $scope.load_notification('success');
                $scope.editing = false;
              });
            })
            .on('error', function (res) {
              setEngineStatus(res, false);
              console.log('error', res);
              setImmediate(function () {
                $scope.$apply(function () {
                  $scope.mode = 'error';

                  $scope.loading = false;
                  $scope.load_notification("error");
                  $scope.editing = false;
                });
              });
            });

        function setEngineStatus(res, accepted) {
          $scope.engine_result = res.engine_result;
          $scope.engine_result_message = res.engine_result_message;
          $scope.engine_status_accepted = accepted;

          switch (res.engine_result.slice(0, 3)) {
            case 'tes':
              $scope.tx_result = accepted ? 'cleared' : 'pending';
              break;
            case 'tem':
              $scope.tx_result = 'malformed';
              break;
            case 'ter':
              $scope.tx_result = 'failed';
              break;
            case 'tec':
              $scope.tx_result = 'failed';
              break;
            case 'tel':
              $scope.tx_result = "local";
              break;
            case 'tep':
              console.warn('Unhandled engine status encountered!');
          }
          if ($scope.tx_result=="cleared"){
            $scope.brlConnected = true;
            $scope.showInstructions = true;

          }
          console.log($scope.tx_result);
        }

        keychain.requestSecret($id.account, $id.username, function (err, secret) {
          // XXX Error handling
          if (err) {
            $scope.loading = false;
            $scope.load_notification('error');
            console.log(err);
            return;
          }

          $scope.mode = 'granting';

          tx.secret(secret);
          tx.submit();


        });

        // $timeout(function(){
        //   $scope.mode = 'main';
        // }, 10000);

      };

    }]);

};

module.exports = BrlTab;
