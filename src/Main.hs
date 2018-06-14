{-#LANGUAGE TemplateHaskell #-}
{-#LANGUAGE OverloadedStrings #-}
module Main
where

import System.Environment
import Network.WebSockets
import Network.Wai
import Network.Wai.Handler.WebSockets
import Network.Wai.Handler.Warp as Warp
import Data.Text (Text)
import qualified Data.Text as Text
import qualified Data.Text.IO as Text
import Control.Concurrent.Chan
import Control.Concurrent
import Data.FileEmbed
import Control.Monad
import Data.ByteString (ByteString)
import qualified Data.ByteString.Lazy as LBS
import qualified Data.ByteString.Lazy.UTF8 as LUTF8
import Network.HTTP.Types
import Data.Monoid
import Control.Exception

main = do
  feed <- newChan :: IO (Chan Text)
  history <- newMVar [] :: IO (MVar [Text])
  forkIO . forever $ do
    Text.getLine >>= writeChan feed
  forkIO . forever $ do
    ln <- readChan feed
    t <- takeMVar history
    let t' = ln:t
    putMVar history t'
  Warp.runEnv 5000 $ appMain history feed

appMain :: MVar [Text] -> Chan Text -> Application
appMain history feed rq respond = do
  case pathInfo rq of
    ["ws"] ->
      websocketsOr
        defaultConnectionOptions
        (appWS history feed)
        (error "not a WS request")
        rq
        respond
    _ -> case requestMethod rq of
      "GET" -> do
        case pathInfo rq of
          -- [] -> serve "text/html;charset=utf8" $ LBS.fromStrict $(embedFile "static/index.html")
          -- ["index.js"] -> serve "text/javascript" $ LBS.fromStrict $(embedFile "static/index.js")
          -- ["hterm_all.js"] -> serve "text/javascript" $ LBS.fromStrict $(embedFile "static/hterm_all.js")
          -- ["style.css"] -> serve "text/css" $ LBS.fromStrict $(embedFile "static/style.css")
          [] -> serveDyn "text/html;charset=utf8" "static/index.html"
          ["index.js"] -> serveDyn "text/javascript" "static/index.js"
          ["hterm_all.js"] -> serveDyn "text/javascript" "static/hterm_all.js"
          ["style.css"] -> serveDyn "text/css" "static/style.css"
          _ -> error "Not Found"
      _ -> error "Invalid method"
  where
    serve :: ByteString -> LBS.ByteString -> IO ResponseReceived
    serve contentType body =
      respond $
        responseLBS
          (mkStatus 200 "OK") 
          [("Content-Type", contentType)]
          body

    serveDyn :: ByteString -> FilePath -> IO ResponseReceived
    serveDyn contentType fn =
      respond $
        responseFile
          (mkStatus 200 "OK") 
          [("Content-Type", contentType)]
          fn
          Nothing

appWS history feedOrig pendingConn = do
  conn <- acceptRequest pendingConn
  forkPingThread conn 30
  putStrLn "Connected"
  hist <- takeMVar history
  feed <- dupChan feedOrig
  putMVar history hist

  -- Send the last 100 lines of history
  sendTextDatas conn (reverse $ take 100 hist)
  t <- forkIO . forever $ do
    ln <- readChan feed
    putStrLn $ "Send: " <> show ln
    sendTextData conn ln
  flip finally (disconnect t) . forever $ do
    receive conn >> putStrLn "recv"
  where
    disconnect :: ThreadId -> IO ()
    disconnect t = do
      killThread t
      putStrLn "Disconnect"
