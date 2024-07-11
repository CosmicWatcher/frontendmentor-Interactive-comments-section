import "./App.css";
import { useEffect, useRef, useState } from "react";

export default function App() {
  return <Chat />;
}

function Chat() {
  const [data, setData] = useState(null);

  function updateData(data) {
    setData(data);
  }

  const messageCardFactory = () => {
    let res = [];
    const orderMapping = new Map();
    let count = 0;
    for (const [id, comment] of Object.entries(data.comments)) {
      if (!(id in orderMapping)) {
        orderMapping[id] = count;
        count++;
      }
      comment.replies.forEach((replyID) => {
        if (!(replyID in orderMapping)) {
          orderMapping[replyID] = count;
          count++;
        }
      });

      res.push(
        <MessageCard
          key={id}
          uid={id}
          order={orderMapping[id]}
          msg={comment.content}
          timestamp={comment.createdAt}
          score={comment.score}
          replyingTo={"replyingTo" in comment ? comment.replyingTo : ""}
          username={comment.user.username}
          imgURL={"avatars/" + comment.user.image.png}
          currentUsername={data.currentUser.username}
          currentImgURL={"avatars/" + data.currentUser.image.png}
          dataUpdater={updateData}
          data={Object.assign({}, data)}
        />,
      );
    }
    return res;
  };

  useEffect(() => {
    let ignore = false; // good practice according to https://react.dev/learn/synchronizing-with-effects#fetching-data

    async function readDatabase() {
      try {
        const data = await (await fetch("data.json")).json();

        if (!ignore) {
          const obj = {};
          data.comments.forEach((comment) => {
            obj[comment.id] = comment;
          });
          data.comments = obj;
          updateData(data);
        }
      } catch (error) {
        console.error(error);
      }
    }
    readDatabase();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <div className="fixed bottom-0 right-0 m-5 h-auto max-h-[90%] w-1/2 overflow-y-auto rounded-3xl bg-indigo-500 p-4 shadow-2xl">
        <div className="flex flex-col">
          {data == null ? "" : messageCardFactory()}
        </div>
        <div className="sticky bottom-0">
          <div className="mb-5 mt-2 grid grid-cols-[5%_80%_15%] grid-rows-1 items-center justify-items-center bg-indigo-700 p-3 shadow-xl">
            <NewMessage
              buttonTxt="SEND"
              imgURL={
                data == null ? "" : "avatars/" + data.currentUser.image.png
              }
              visible={true}
              id={data == null ? 0 : Object.keys(data.comments).length + 1}
              data={Object.assign({}, data)}
              dataUpdater={updateData}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function MessageCard({
  uid,
  order,
  username,
  msg,
  timestamp,
  imgURL,
  score,
  replyingTo,
  currentUsername,
  currentImgURL,
  data,
  dataUpdater,
}) {
  const [voteCount, setVoteCount] = useState(score);
  const [visible, setVisible] = useState(false);

  const IS_CURRENT_USER = currentUsername == username;

  function handleClick(e) {
    if (e.target.classList.contains("upvote"))
      setVoteCount((voteCount) => voteCount + 1);
    else if (e.target.classList.contains("downvote"))
      setVoteCount((voteCount) => voteCount - 1);
    else if (e.target.classList.contains("newMsgBtn")) setVisible(true);
    else if (e.target.classList.contains("deleteMsgBtn")) {
      if (confirm("Are you Sure?")) {
        delete data.comments[uid];
        dataUpdater(data);
      }
    }
  }

  return (
    <div style={{ order: `${order}` }}>
      <div
        onClick={handleClick}
        id={uid}
        className={
          "my-2 grid grid-cols-[7%_80%_13%] grid-rows-[1fr_2fr] rounded-tl-xl bg-indigo-900 p-3 shadow-xl " +
          (replyingTo != "" ? " ml-10" : "")
        }
      >
        <div className="col-span-1 row-span-2 justify-self-center p-4">
          <div className="min-w-10 rounded-2xl bg-slate-300 text-center">
            <button className="upvote py-1 font-black text-indigo-600">
              +
            </button>
            <div className="py-1 font-black text-indigo-600">{voteCount}</div>
            <button className="downvote py-1 font-black text-indigo-600">
              -
            </button>
          </div>
        </div>
        <div className="col-start-2 col-end-3 flex items-center justify-start">
          <img src={imgURL} className="size-10 rounded-2xl" />
          <div className="px-5 font-bold text-indigo-400">{username}</div>
          <div className="px-5 text-indigo-300">{timestamp}</div>
        </div>
        {IS_CURRENT_USER ? (
          <div className="flex justify-evenly">
            <button className="deleteMsgBtn col-start-3 col-end-4 items-center justify-end font-bold text-red-400">
              Delete
            </button>
            <button className="newMsgBtn col-start-3 col-end-4 items-center justify-end font-bold text-slate-400">
              Edit
            </button>
          </div>
        ) : (
          <button className="newMsgBtn col-start-3 col-end-4 items-center justify-end font-bold text-slate-400">
            Reply
          </button>
        )}
        <p
          key={"msg"}
          className="col-start-2 col-end-4 p-4 text-left font-sans text-lg text-slate-300"
        >
          {replyingTo != ""
            ? [
                <span
                  key={"replyingTo"}
                  className="font-bold text-indigo-400"
                >{`@${replyingTo} `}</span>,
                msg,
              ]
            : msg}
        </p>
      </div>
      <div
        className={
          (visible ? "grid " : "hidden ") +
          "mb-4 grid-cols-[5%_80%_15%] grid-rows-1 items-center justify-items-center bg-indigo-900 p-3 shadow-xl" +
          (replyingTo != "" ? " ml-10" : "")
        }
      >
        <NewMessage
          buttonTxt={IS_CURRENT_USER ? "UPDATE" : "REPLY"}
          imgURL={currentImgURL}
          msg={IS_CURRENT_USER ? msg : ""}
          id={IS_CURRENT_USER ? uid : Object.keys(data.comments).length + 1}
          data={data}
          dataUpdater={dataUpdater}
          visible={visible}
          replyingToID={uid}
          setVisible={setVisible}
        />
      </div>
    </div>
  );
}

function NewMessage({
  id,
  buttonTxt,
  imgURL,
  msg = "",
  replyingToID = null,
  visible,
  data,
  dataUpdater,
  setVisible = null,
}) {
  const textRef = useRef(null);

  function handleClick() {
    if (textRef.current != null) {
      if (id in data.comments)
        data.comments[id]["content"] = textRef.current.value;
      else {
        if (replyingToID != null) data.comments[replyingToID].replies.push(id);
        data.comments[id] = {
          id: id,
          content: textRef.current.value,
          score: 1,
          createdAt: new Date().toLocaleString(),
          replyingTo:
            replyingToID != null
              ? data.comments[replyingToID].user.username
              : "",
          user: {
            image: {
              png: "image-juliusomo.png",
            },
            username: "juliusomo",
          },
          replies: [],
        };
      }
      dataUpdater(data);
      if (setVisible != null) setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <>
      <img
        src={imgURL}
        className="size-10 self-start justify-self-start rounded-2xl"
      />
      <textarea
        ref={textRef}
        className="h-32 justify-self-stretch rounded-lg border-2 border-black bg-inherit p-2 text-left font-sans text-lg text-slate-300"
        placeholder="Add a comment"
        defaultValue={msg}
        autoFocus
      ></textarea>
      <button
        onClick={handleClick}
        className="rounded-lg bg-cyan-500 p-3 text-lg font-bold text-cyan-900"
      >
        {buttonTxt}
      </button>
    </>
  );
}
