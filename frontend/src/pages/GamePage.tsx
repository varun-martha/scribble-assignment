import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Canvas } from "../components/Canvas";
import { Chat } from "../components/Chat";
import { GuessInput } from "../components/GuessInput";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { WordSelection } from "../components/WordSelection";
import { ResultScreen } from "../components/ResultScreen";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
      return;
    }

    const intervalId = setInterval(() => {
      roomStore.fetchRoom();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [navigate, room, roomStore]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const isDrawer = room.currentRound?.drawerId === participantId;
  const roundStatus = room.currentRound?.roundStatus;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (roundStatus === "Drawing" && room.currentRound?.roundEndTime) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((room.currentRound!.roundEndTime! - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [roundStatus, room.currentRound?.roundEndTime]);

  const handleSelectWord = async (word: string) => {
    setIsSelecting(true);
    try {
      await roomStore.selectWord(word);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSelecting(false);
    }
  };

  if (room.status === "results") {
    return (
      <section className="panel game-page">
        <ResultScreen />
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
          {timeLeft !== null && <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 10 ? 'red' : 'black' }}>Time: {timeLeft}s</div>}
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <div className="mt-4">
            <Chat />
          </div>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="canvas-placeholder flex items-center justify-center bg-white flex-col" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
              {roundStatus === "SelectingWord" ? (
                isDrawer ? (
                  <WordSelection 
                    wordOptions={room.currentRound?.wordOptions ?? []} 
                    onSelect={handleSelectWord} 
                    isLoading={isSelecting} 
                  />
                ) : (
                  <div className="text-gray-500 font-medium">Waiting for drawer to pick a word...</div>
                )
              ) : roundStatus === "Drawing" ? (
                <>
                  <Canvas strokes={room.strokes || []} isDrawer={isDrawer} width={800} height={500} />
                  {isDrawer && (
                    <div style={{ marginTop: '10px' }}>
                      <button className="button button--secondary" onClick={() => roomStore.clearCanvas()}>
                        Clear Canvas
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500 font-medium">Waiting...</div>
              )}
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            <GuessInput />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
