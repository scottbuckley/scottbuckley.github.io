module Grid (Grid, makeGrid, setWall) where
import Data.List(intercalate)
import Text.Printf (printf)
import Data.Array

type Pressure = Double
data Cell = Cell {pressure :: Pressure}
          | Wall
data Grid = Grid Int Int [[Cell]]

------- BUILD -------

assertP :: (a -> Bool) -> String -> a -> a
assertP f s a | f a = a
              | otherwise = error s

assertC :: Bool -> String -> a -> a
assertC True _ a = a
assertC False s _ = error s
              
assertG0 :: Int -> a -> a
assertG0 x = assertC (x>0) "Int must be >0"

assertPos :: Int -> a -> a
assertPos x = assertC (x>=0) "Int must be positive"

makeGrid :: Int -> Int -> Double -> Grid
makeGrid w h v = assertG0 w $ assertG0 h $
                 Grid w h $ replicate h $ replicate w (Cell v)

------- MODIFY -------

modifyElem :: Int -> (a -> a) -> [a] -> [a]
modifyElem _ _ [] = []
modifyElem n f (h:t) | n>0 = h : modifyElem (n-1) f t
                     | otherwise = f h : t

setCell :: Cell -> Int -> Int -> Grid -> Grid
setCell c x y (Grid w h l) = Grid w h $ 
                             modifyElem y (modifyElem x (const c)) l

setWall = setCell Wall


------- PRINT -------
showGridLine :: [Cell] -> String
showGridLine l = intercalate "  " $ map show l

showGrid :: Grid -> String
showGrid (Grid _ _ l) = intercalate ['\n'] $ map showGridLine l

instance Show Cell where
  show (Cell d) = printf "%.2g" d
  show Wall     = "####"

instance Show Grid where
  show = showGrid